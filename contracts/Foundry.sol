// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IFoundryData.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/ITokenFactory.sol";
import "./interfaces/IFeeNFTFactory.sol";
import "./interfaces/IMortgageNFTFactory.sol";
import "./interfaces/IMarketFactory.sol";
import "./interfaces/ICurveFactory.sol";
import "./interfaces/IFeeNFT.sol";
import "./interfaces/IMortgageNFT.sol";
import "./interfaces/IMarket.sol";

contract Foundry is IFoundry, Ownable {
  uint256 public override FEE_DENOMINATOR = 100000;
  uint256 public override TOTAL_PERCENT = 100000;

  address public immutable override foundryData;

  bool public isInitialized;
  address public override feeNFTFactory;
  address public override mortgageNFTFactory;
  address public override marketFactory;
  address public override tokenFactory;

  uint256 public immutable override defaultMortgageFee;
  address public immutable override defaultMortgageFeeRecipient;

  mapping(address => bool) public override curveFactoryWhitelist;

  mapping(uint256 => bool) private _appExist;

  // appId => tid => address
  mapping(uint256 => mapping(string => address)) private _tokens;
  // appId => tid => data
  mapping(uint256 => mapping(string => bytes)) private _tokenData;

  modifier appExistModifier(uint256 appId) {
    require(_appExist[appId], "AE");
    _;
  }

  constructor(
    address _foundryData,
    uint256 _defaultMortgageFee,
    address _defaultMortgageFeeRecipient
  ) Ownable(msg.sender) {
    foundryData = _foundryData;

    defaultMortgageFee = _defaultMortgageFee;
    defaultMortgageFeeRecipient = _defaultMortgageFeeRecipient;
  }

  function initialize(
    address _feeNFTFactory,
    address _mortgageNFTFactory,
    address _marketFactory,
    address _tokenFactory
  ) external onlyOwner {
    require(!isInitialized, "IE");
    feeNFTFactory = _feeNFTFactory;
    mortgageNFTFactory = _mortgageNFTFactory;
    marketFactory = _marketFactory;
    tokenFactory = _tokenFactory;

    isInitialized = true;
  }

  function nextAppId() external view override returns (uint256) {
    return IFoundryData(foundryData).nextAppId();
  }

  function apps(uint256 appId) external view override appExistModifier(appId) returns (IFoundryData.App memory app) {
    return IFoundryData(foundryData).apps(appId);
  }

  function appFees(
    uint256 appId
  ) external view override appExistModifier(appId) returns (IFoundryData.AppFee memory appFee) {
    return IFoundryData(foundryData).appFees(appId);
  }

  function token(uint256 appId, string memory tid) external view appExistModifier(appId) returns (address) {
    return _tokens[appId][tid];
  }

  function tokenExist(uint256 appId, string memory tid) public view override appExistModifier(appId) returns (bool) {
    return _tokens[appId][tid] != address(0);
  }

  function tokenData(
    uint256 appId,
    string memory tid
  ) external view override appExistModifier(appId) returns (bytes memory) {
    return _tokenData[appId][tid];
  }

  function createApp(
    string memory _name,
    address _owner,
    address _curveFactory,
    bytes memory _curveParams,
    address _payToken,
    AppFeeParams memory appFeeParams
  ) external override {
    require(curveFactoryWhitelist[_curveFactory] || curveFactoryWhitelist[address(0)], "CFWE");

    uint256 appId = IFoundryData(foundryData).nextAppId();

    address curve = ICurveFactory(_curveFactory).create(appId, _curveParams);

    address feeNFT = IFeeNFTFactory(feeNFTFactory).create(appId, _name, _owner);
    address mortgageNFT = IMortgageNFTFactory(mortgageNFTFactory).create(appId, _name, _owner);
    address market = IMarketFactory(marketFactory).create(appId, FEE_DENOMINATOR, TOTAL_PERCENT, curve, _payToken);

    IMortgageNFT(mortgageNFT).initialize(market);
    IMarket(market).initialize(feeNFT, mortgageNFT);

    IFoundryData.App memory app = IFoundryData.App({
      name: _name,
      owner: _owner,
      operator: address(0),
      curve: curve,
      feeNFT: feeNFT,
      mortgageNFT: mortgageNFT,
      market: market,
      payToken: _payToken,
      foundry: address(this)
    });

    IFoundryData.AppFee memory fee = IFoundryData.AppFee({
      // app owner buy sell fee
      appOwnerBuyFee: appFeeParams.appOwnerBuyFee,
      appOwnerSellFee: appFeeParams.appOwnerSellFee,
      // app owner mortgage fee
      appOwnerMortgageFee: appFeeParams.appOwnerMortgageFee,
      // app owner all fee recipient
      appOwnerFeeRecipient: appFeeParams.appOwnerFeeRecipient,
      // nft owner buy sell fee
      nftOwnerBuyFee: appFeeParams.nftOwnerBuyFee,
      nftOwnerSellFee: appFeeParams.nftOwnerSellFee,
      // platform mortgage fee
      platformMortgageFee: defaultMortgageFee,
      platformMortgageFeeRecipient: defaultMortgageFeeRecipient
    });

    require(IFoundryData(foundryData).createApp(app, fee) == appId, "AIE");
    _appExist[appId] = true;

    emit CreateApp(appId, app, fee, msg.sender);
  }

  function createToken(
    uint256 appId,
    string memory tid,
    bytes memory tData,
    uint256[] memory nftPercents,
    address[] memory nftOwners,
    bytes[] memory nftData
  ) external override appExistModifier(appId) returns (address tokenAddr, uint256[] memory tokenIds) {
    require(!tokenExist(appId, tid), "TE");
    require(msg.sender == IFoundryData(foundryData).apps(appId).operator, "AOPE");
    require(nftPercents.length == nftOwners.length, "LE1");
    require(nftPercents.length == nftData.length, "LE2");

    uint256 totalPercent = 0;
    for (uint256 i = 0; i < nftPercents.length; i++) {
      totalPercent += nftPercents[i];
    }
    if (nftPercents.length > 0) {
      require(totalPercent == TOTAL_PERCENT, "TPE");
    }

    tokenAddr = ITokenFactory(tokenFactory).create(appId, tid);

    _tokens[appId][tid] = tokenAddr;
    _tokenData[appId][tid] = tData;

    if (nftPercents.length > 0) {
      tokenIds = IFeeNFT(IFoundryData(foundryData).apps(appId).feeNFT).mint(tid, nftPercents, nftOwners, nftData);
    }

    emit CreateToken(appId, tid, tokenAddr, tData, tokenIds, nftPercents, nftOwners, nftData, msg.sender);
  }

  function setAppOperator(uint256 appId, address operator) external override appExistModifier(appId) {
    IFoundryData fd = IFoundryData(foundryData);
    IFoundryData.App memory app = fd.apps(appId);

    require(app.owner == msg.sender, "AOE");
    require(app.operator == address(0), "AOPE");

    fd.setAppOperator(appId, operator);

    emit SetAppOperator(appId, operator, msg.sender);
  }

  function setAppOwner(uint256 appId, address newOwner) external override appExistModifier(appId) {
    IFoundryData fd = IFoundryData(foundryData);
    IFoundryData.App memory app = fd.apps(appId);

    require(app.owner == msg.sender, "AOE");

    fd.setAppOwner(appId, newOwner);

    emit SetAppOwner(appId, newOwner, msg.sender);
  }

  function setAppOwnerFeeRecipient(
    uint256 appId,
    address newAppOwnerFeeRecipient
  ) external override appExistModifier(appId) {
    IFoundryData fd = IFoundryData(foundryData);
    IFoundryData.App memory app = fd.apps(appId);

    require(app.owner == msg.sender, "AOE");

    IFoundryData.AppFee memory appFee = fd.appFees(appId);
    appFee.appOwnerFeeRecipient = newAppOwnerFeeRecipient;

    fd.updateAppFee(appId, appFee);

    emit SetAppOwnerFeeRecipient(appId, newAppOwnerFeeRecipient, msg.sender);
  }

  function updateCurveFactoryWhitelist(address factory, bool enabled) external override onlyOwner {
    curveFactoryWhitelist[factory] = enabled;

    emit UpdateCurveFactoryWhitelist(factory, enabled, msg.sender);
  }

  function setPlatformMortgageFee(
    uint256 appId,
    uint256 newMortgageFee
  ) external override onlyOwner appExistModifier(appId) {
    IFoundryData fd = IFoundryData(foundryData);

    IFoundryData.AppFee memory appFee = fd.appFees(appId);
    appFee.platformMortgageFee = newMortgageFee;

    fd.updateAppFee(appId, appFee);

    emit SetPlatformMortgageFee(appId, newMortgageFee, msg.sender);
  }

  function setPlatformMortgageFeeRecipient(
    uint256 appId,
    address newMortgageFeeRecipient
  ) external override onlyOwner appExistModifier(appId) {
    IFoundryData fd = IFoundryData(foundryData);

    IFoundryData.AppFee memory appFee = fd.appFees(appId);
    appFee.platformMortgageFeeRecipient = newMortgageFeeRecipient;

    fd.updateAppFee(appId, appFee);

    emit SetPlatformMortgageFeeRecipient(appId, newMortgageFeeRecipient, msg.sender);
  }
}
