// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IFoundry {
  struct App {
    string name;
    address owner;
    address operator;
    address publicNFT;
    address mortgageNFT;
    address market;
    address payToken;
  }

  event CreateApp(
    uint256 appId,
    string name,
    address owner,
    address operator,
    address curve,
    address payToken,
    uint256 buySellFee,
    address publicNFT,
    address mortgageNFT,
    address market,
    address sender
  );

  event CreateToken(
    uint256 appId,
    string tid,
    bytes tData,
    uint256[] nftTokenIds,
    uint256[] nftPercents,
    address[] nftOwners,
    bytes[] nftData,
    address sender
  );

  event SetAppOwner(uint256 appId, address newOwner, address sender);

  event SetMortgageFee(uint256 appId, uint256 newMortgageFee, address sender);

  event SetMortgageFeeRecipient(uint256 appId, address newMortgageFeeOwner, address sender);

  function FEE_DENOMINATOR() external view returns (uint256);

  function TOTAL_PERCENT() external view returns (uint256);

  function publicNFTFactory() external view returns (address);

  function mortgageNFTFactory() external view returns (address);

  function marketFactory() external view returns (address);

  function nextAppId() external view returns (uint256);

  function defaultMortgageFee() external view returns (uint256);

  function defaultMortgageFeeRecipient() external view returns (address);

  function mortgageFee(uint256 appId) external view returns (uint256);

  function mortgageFeeRecipient(uint256 appId) external view returns (address);

  function apps(uint256 appId) external view returns (App memory app);

  function tokenExist(uint256 appId, string memory tid) external view returns (bool);

  function tokenData(uint256 appId, string memory tid) external view returns (bytes memory);

  function createApp(
    string memory name,
    address owner,
    address operator,
    address curve,
    address payToken,
    uint256 buySellFee
  ) external;

  function createToken(
    uint256 appId,
    string memory tid,
    bytes memory tData,
    uint256[] memory nftPercents,
    address[] memory nftOwners,
    bytes[] memory nftData
  ) external returns (uint256[] memory tokenIds);

  function setAppOwner(uint256 appId, address newOwner) external;

  function setMortgageFee(uint256 appId, uint256 newMortgageFee) external;

  function setMortgageFeeRecipient(uint256 appId, address newMortgageFeeRecipient) external;
}
