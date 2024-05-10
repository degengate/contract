// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IFoundry.sol";
import "./interfaces/IPublicNFTFactory.sol";
import "./interfaces/IMortgageNFTFactory.sol";
import "./interfaces/IMarketFactory.sol";
import "./interfaces/IPublicNFT.sol";
import "./interfaces/IMortgageNFT.sol";
import "./interfaces/IMarket.sol";

contract Foundry is IFoundry, Ownable {
  uint256 public constant override FEE_DENOMINATOR = 100000;
  uint256 public constant override TOTAL_PERCENT = 100000;

  address public immutable override publicNFTFactory;
  address public immutable override mortgageNFTFactory;
  address public immutable override marketFactory;

  uint256 public override nextAppId = 1;

  uint256 public immutable override defaultMortgageFee;
  address public immutable override defaultMortgageFeeRecipient;

  // appId => fee
  mapping(uint256 => uint256) public override mortgageFee;
  // appId => fee recipient
  mapping(uint256 => address) public override mortgageFeeRecipient;
  // appId => app
  mapping(uint256 => IFoundry.App) private _apps;
  // appId => tid => exist
  mapping(uint256 => mapping(string => bool)) private _tokenExist;
  // appId => tid => data
  mapping(uint256 => mapping(string => bytes)) private _tokenData;

  modifier appExist(uint256 appId) {
    require(appId >= 1 && appId < nextAppId, "AE");
    _;
  }

  constructor(
    address _publicNFTFactory,
    address _mortgageNFTFactory,
    address _marketFactory,
    uint256 _defaultMortgageFee,
    address _defaultMortgageFeeRecipient
  ) Ownable() {
    publicNFTFactory = _publicNFTFactory;
    mortgageNFTFactory = _mortgageNFTFactory;
    marketFactory = _marketFactory;

    defaultMortgageFee = _defaultMortgageFee;
    defaultMortgageFeeRecipient = _defaultMortgageFeeRecipient;
  }

  function apps(uint256 appId) external view override returns (IFoundry.App memory app) {
    return _apps[appId];
  }

  function tokenExist(uint256 appId, string memory tid) external view override returns (bool) {
    return _tokenExist[appId][tid];
  }

  function tokenData(uint256 appId, string memory tid) external view override returns (bytes memory) {
    return _tokenData[appId][tid];
  }

  function createApp(
    string memory _name,
    address _owner,
    address _operator,
    address _curve,
    address _payToken,
    uint256 _buySellFee
  ) external override {
    uint256 appId = nextAppId;
    nextAppId += 1;

    address publicNFT = IPublicNFTFactory(publicNFTFactory).create(appId, _name, _owner);
    address mortgageNFT = IMortgageNFTFactory(mortgageNFTFactory).create(appId, _name, _owner);
    address market = IMarketFactory(marketFactory).create(
      appId,
      FEE_DENOMINATOR,
      TOTAL_PERCENT,
      _curve,
      _payToken,
      _buySellFee
    );

    IMortgageNFT(mortgageNFT).initialize(market);
    IMarket(market).initialize(publicNFT, mortgageNFT);

    mortgageFee[appId] = defaultMortgageFee;
    mortgageFeeRecipient[appId] = defaultMortgageFeeRecipient;

    _apps[appId] = IFoundry.App({
      name: _name,
      owner: _owner,
      operator: _operator,
      publicNFT: publicNFT,
      mortgageNFT: mortgageNFT,
      market: market,
      payToken: _payToken
    });

    emit CreateApp(
      appId,
      _name,
      _owner,
      _operator,
      _curve,
      _payToken,
      _buySellFee,
      publicNFT,
      mortgageNFT,
      market,
      msg.sender
    );
  }

  function createToken(
    uint256 appId,
    string memory tid,
    bytes memory tData,
    uint256[] memory nftPercents,
    address[] memory nftOwners,
    bytes[] memory nftData
  ) external override appExist(appId) returns (uint256[] memory tokenIds) {
    require(!_tokenExist[appId][tid], "TE");
    require(msg.sender == _apps[appId].operator, "AOPE");
    require(nftPercents.length == nftOwners.length, "LE1");
    require(nftPercents.length == nftData.length, "LE2");

    uint256 totalPercent = 0;
    for (uint256 i = 0; i < nftPercents.length; i++) {
      totalPercent += nftPercents[i];
    }
    require(totalPercent == TOTAL_PERCENT, "TPE");

    for (uint256 i = 0; i < nftOwners.length; i++) {
      require(nftOwners[i] != address(0), "ADDE");
    }

    _tokenExist[appId][tid] = true;
    _tokenData[appId][tid] = tData;

    tokenIds = IPublicNFT(_apps[appId].publicNFT).mint(tid, nftPercents, nftOwners, nftData);

    emit CreateToken(appId, tid, tData, tokenIds, nftPercents, nftOwners, nftData, msg.sender);
  }

  function setAppOwner(uint256 appId, address newOwner) external override appExist(appId) {
    require(msg.sender == _apps[appId].owner, "AOE");

    _apps[appId].owner = newOwner;

    emit SetAppOwner(appId, newOwner, msg.sender);
  }

  function setMortgageFee(uint256 appId, uint256 newMortgageFee) external override onlyOwner appExist(appId) {
    mortgageFee[appId] = newMortgageFee;

    emit SetMortgageFee(appId, newMortgageFee, msg.sender);
  }

  function setMortgageFeeRecipient(
    uint256 appId,
    address newMortgageFeeRecipient
  ) external override onlyOwner appExist(appId) {
    mortgageFeeRecipient[appId] = newMortgageFeeRecipient;

    emit SetMortgageFeeRecipient(appId, newMortgageFeeRecipient, msg.sender);
  }
}
