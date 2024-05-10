// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IMarket {
  event Initialize(address publicNFT, address mortgageNFT);

  event Buy(
    string tid,
    uint256 tokenAmount,
    uint256 payTokenAmount,
    address sender,
    address user,
    uint256[] feeTokenIds,
    address[] feeOwners,
    uint256[] feeAmounts
  );

  event Sell(
    string tid,
    uint256 tokenAmount,
    uint256 payTokenAmount,
    address sender,
    address user,
    uint256[] feeTokenIds,
    address[] feeOwners,
    uint256[] feeAmounts
  );

  event Mortgage(
    uint256 tokenId,
    string tid,
    uint256 tokenAmount,
    uint256 payTokenAmount,
    uint256 feeAmount,
    address sender
  );

  event Redeem(uint256 tokenId, string tid, uint256 tokenAmount, uint256 payTokenAmount, address sender);

  event Multiply(
    uint256 tokenId,
    string tid,
    uint256 multiplyAmount,
    uint256 payTokenAmount,
    uint256 feeAmount,
    address sender,
    uint256[] feeTokenIds,
    address[] feeOwners,
    uint256[] feeAmounts
  );

  event Cash(
    uint256 tokenId,
    string tid,
    uint256 tokenAmount,
    uint256 payTokenAmount,
    address sender,
    uint256[] feeTokenIds,
    address[] feeOwners,
    uint256[] feeAmounts
  );

  event Merge(
    uint256 tokenId,
    string tid,
    uint256 otherTokenId,
    uint256 payTokenAmount,
    uint256 feeAmount,
    address sender
  );

  event Split(
    uint256 tokenId,
    uint256 newTokenId,
    string tid,
    uint256 splitAmount,
    uint256 payTokenAmount,
    address sender
  );

  function feeDenominator() external view returns (uint256);

  function totalPercent() external view returns (uint256);

  function foundry() external view returns (address);

  function appId() external view returns (uint256);

  function curve() external view returns (address);

  function payToken() external view returns (address);

  function buySellFee() external view returns (uint256);

  function publicNFT() external view returns (address);

  function mortgageNFT() external view returns (address);

  function initialize(address publicNFT, address mortgageNFT) external;

  function totalSupply(string memory tid) external view returns (uint256);

  function balanceOf(string memory tid, address account) external view returns (uint256);

  function getBuyPayTokenAmount(string memory tid, uint256 tokenAmount) external view returns (uint256 payTokenAmount);

  function getSellPayTokenAmount(string memory tid, uint256 tokenAmount) external view returns (uint256 payTokenAmount);

  function getPayTokenAmount(uint256 base, uint256 add) external view returns (uint256 payTokenAmount);

  function buy(string memory tid, uint256 tokenAmount) external payable returns (uint256 payTokenAmount);
  function buyProxy(
    string memory tid,
    uint256 tokenAmount,
    address user
  ) external payable returns (uint256 payTokenAmount);

  function sell(string memory tid, uint256 tokenAmount) external returns (uint256 payTokenAmount);
  function sellProxy(string memory tid, uint256 tokenAmount, address user) external returns (uint256 payTokenAmount);

  function mortgage(
    string memory tid,
    uint256 tokenAmount
  ) external returns (uint256 nftTokenId, uint256 payTokenAmount);
  function mortgageProxy(
    string memory tid,
    uint256 tokenAmount,
    address user
  ) external returns (uint256 nftTokenId, uint256 payTokenAmount);

  function mortgageAdd(uint256 nftTokenId, uint256 tokenAmount) external returns (uint256 payTokenAmount);
  function mortgageAddProxy(uint256 nftTokenId, uint256 tokenAmount) external returns (uint256 payTokenAmount);

  function redeem(uint256 nftTokenId, uint256 tokenAmount) external payable returns (uint256 payTokenAmount);
  function redeemProxy(uint256 nftTokenId, uint256 tokenAmount) external payable returns (uint256 payTokenAmount);

  function multiply(
    string memory tid,
    uint256 multiplyAmount
  ) external payable returns (uint256 nftTokenId, uint256 payTokenAmount);
  function multiplyProxy(
    string memory tid,
    uint256 multiplyAmount,
    address user
  ) external payable returns (uint256 nftTokenId, uint256 payTokenAmount);

  function multiplyAdd(uint256 nftTokenId, uint256 multiplyAmount) external payable returns (uint256 payTokenAmount);
  function multiplyAddProxy(
    uint256 nftTokenId,
    uint256 multiplyAmount
  ) external payable returns (uint256 payTokenAmount);

  function cash(uint256 nftTokenId, uint256 tokenAmount) external returns (uint256 payTokenAmount);
  function cashProxy(uint256 nftTokenId, uint256 tokenAmount) external returns (uint256 payTokenAmount);

  function merge(uint256 nftTokenId, uint256 otherNFTTokenId) external returns (uint256 payTokenAmount);
  function mergeProxy(uint256 nftTokenId, uint256 otherNFTTokenId) external returns (uint256 payTokenAmount);

  function split(
    uint256 nftTokenId,
    uint256 splitAmount
  ) external payable returns (uint256 payTokenAmount, uint256 newNFTTokenId);
  function splitProxy(
    uint256 nftTokenId,
    uint256 splitAmount
  ) external payable returns (uint256 payTokenAmount, uint256 newNFTTokenId);
}
