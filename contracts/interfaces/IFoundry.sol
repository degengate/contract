// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "./IFoundryData.sol";

interface IFoundry {
  struct AppFeeParams {
    // app owner buy sell fee
    uint256 appOwnerBuyFee;
    uint256 appOwnerSellFee;
    // app owner mortgage fee
    uint256 appOwnerMortgageFee;
    // app owner all fee recipient
    address appOwnerFeeRecipient;
    // nft owner buy sell fee
    uint256 nftOwnerBuyFee;
    uint256 nftOwnerSellFee;
  }

  event CreateApp(uint256 appId, IFoundryData.App app, IFoundryData.AppFee appFee, address sender);

  event CreateToken(
    uint256 appId,
    string tid,
    address token,
    bytes tData,
    uint256[] nftTokenIds,
    uint256[] nftPercents,
    address[] nftOwners,
    bytes[] nftData,
    address sender
  );

  event SetAppOperator(uint256 appId, address operator, address sender);

  event SetAppOwner(uint256 appId, address newOwner, address sender);

  event SetAppOwnerFeeRecipient(uint256 appId, address newAppOwnerFeeRecipient, address sender);

  event UpdateCurveFactoryWhitelist(address factory, bool enabled, address sender);

  event SetPlatformMortgageFee(uint256 appId, uint256 newMortgageFee, address sender);

  event SetPlatformMortgageFeeRecipient(uint256 appId, address newMortgageFeeOwner, address sender);

  function FEE_DENOMINATOR() external view returns (uint256);

  function TOTAL_PERCENT() external view returns (uint256);

  function foundryData() external view returns (address);

  function feeNFTFactory() external view returns (address);

  function mortgageNFTFactory() external view returns (address);

  function marketFactory() external view returns (address);

  function tokenFactory() external view returns (address);

  function defaultMortgageFee() external view returns (uint256);

  function defaultMortgageFeeRecipient() external view returns (address);

  function curveFactoryWhitelist(address addr) external view returns (bool);

  function nextAppId() external view returns (uint256);

  function apps(uint256 appId) external view returns (IFoundryData.App memory app);

  function appFees(uint256 appId) external view returns (IFoundryData.AppFee memory appFee);

  function token(uint256 appId, string memory tid) external view returns (address);

  function tokenExist(uint256 appId, string memory tid) external view returns (bool);

  function tokenData(uint256 appId, string memory tid) external view returns (bytes memory);

  function createApp(
    string memory name,
    address owner,
    address _curveFactory,
    bytes memory _curveParams,
    address payToken,
    AppFeeParams memory appFeeParams
  ) external;

  function createToken(
    uint256 appId,
    string memory tid,
    bytes memory tData,
    uint256[] memory nftPercents,
    address[] memory nftOwners,
    bytes[] memory nftData
  ) external returns (address tokenAddr, uint256[] memory tokenIds);

  function setAppOperator(uint256 appId, address operator) external;

  function setAppOwner(uint256 appId, address newOwner) external;

  function setAppOwnerFeeRecipient(uint256 appId, address newAppOwnerFeeRecipient) external;

  function updateCurveFactoryWhitelist(address factory, bool enabled) external;

  function setPlatformMortgageFee(uint256 appId, uint256 newMortgageFee) external;

  function setPlatformMortgageFeeRecipient(uint256 appId, address newMortgageFeeRecipient) external;
}
