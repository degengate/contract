// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IFoundryData {
  struct App {
    string name;
    address owner;
    address operator;
    address curve;
    address feeNFT;
    address mortgageNFT;
    address market;
    address payToken;
    address foundry;
  }

  struct AppFee {
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
    // platform mortgage fee
    uint256 platformMortgageFee;
    address platformMortgageFeeRecipient;
  }

  event CreateApp(uint256 appId, App app, AppFee appFee, address sender);
  event SetAppOperator(uint256 appId, address operator, address sender);
  event SetAppOwner(uint256 appId, address newOwner, address sender);
  event UpdateAppFee(uint256 appId, AppFee appFee, address sender);
  event UpdateFoundryWhitelist(address foundry, bool enabled, address sender);

  function nextAppId() external view returns (uint256);

  function foundryWhitelist(address addr) external view returns (bool);

  function appExist(uint256 appId) external view returns (bool);

  function apps(uint256 appId) external view returns (App memory app);

  function appFees(uint256 appId) external view returns (AppFee memory appFee);

  function createApp(App memory app, AppFee memory appFee) external returns (uint256 appId);

  function setAppOperator(uint256 appId, address operator) external;

  function setAppOwner(uint256 appId, address newOwner) external;

  function updateAppFee(uint256 appId, AppFee memory appFee) external;

  function updateFoundryWhitelist(address foundry, bool enabled) external;
}
