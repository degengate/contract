// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IMarket {
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

  event Initialize(address feeNFT, address mortgageNFT);

  event Buy(
    string tid,
    uint256 tokenAmount,
    uint256 payTokenAmount,
    address sender,
    uint256[] nftFeeTokenIds,
    address[] nftFeeOwners,
    uint256[] nftFeeAmounts,
    uint256 appOwnerFeeAmount
  );

  event Sell(
    string tid,
    uint256 tokenAmount,
    uint256 payTokenAmount,
    address sender,
    uint256[] nftFeeTokenIds,
    address[] nftFeeOwners,
    uint256[] nftFeeAmounts,
    uint256 appOwnerFeeAmount
  );

  event Mortgage(
    uint256 tokenId,
    string tid,
    uint256 tokenAmount,
    uint256 payTokenAmount,
    uint256 platformMortgageFeeAmount,
    uint256 appOwnerMortgageFeeAmount,
    address sender
  );

  event Redeem(uint256 tokenId, string tid, uint256 tokenAmount, uint256 payTokenAmount, address sender);

  event Multiply(
    uint256 tokenId,
    string tid,
    uint256 multiplyAmount,
    uint256 payTokenAmount,
    address sender,
    uint256[] nftFeeTokenIds,
    address[] nftFeeOwners,
    uint256[] nftFeeAmounts,
    uint256 appOwnerFeeAmount,
    uint256 platformMortgageFeeAmount,
    uint256 appOwnerMortgageFeeAmount
  );

  event Cash(
    uint256 tokenId,
    string tid,
    uint256 tokenAmount,
    uint256 payTokenAmount,
    address sender,
    uint256[] nftFeeTokenIds,
    address[] nftFeeOwners,
    uint256[] nftFeeAmounts,
    uint256 appOwnerFeeAmount
  );

  event Merge(
    uint256 tokenId,
    string tid,
    uint256 otherTokenId,
    uint256 payTokenAmount,
    address sender,
    uint256 platformMortgageFeeAmount,
    uint256 appOwnerMortgageFeeAmount
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

  function feeNFT() external view returns (address);

  function mortgageNFT() external view returns (address);

  function initialize(address feeNFT, address mortgageNFT) external;

  function totalSupply(string memory tid) external view returns (uint256);

  function balanceOf(string memory tid, address account) external view returns (uint256);

  function getBuyPayTokenAmount(string memory tid, uint256 tokenAmount) external view returns (uint256 payTokenAmount);

  function getSellPayTokenAmount(string memory tid, uint256 tokenAmount) external view returns (uint256 payTokenAmount);

  function getPayTokenAmount(uint256 base, uint256 add) external view returns (uint256 payTokenAmount);

  function appFee() external view returns (AppFee memory appFee);

  function token(string memory tid) external view returns (address);

  function buy(string memory tid, uint256 tokenAmount) external payable returns (uint256 payTokenAmount);

  function sell(string memory tid, uint256 tokenAmount) external returns (uint256 payTokenAmount);

  function mortgage(
    string memory tid,
    uint256 tokenAmount
  ) external returns (uint256 nftTokenId, uint256 payTokenAmount);

  function mortgageNew(
    string memory tid,
    uint256 tokenAmount
  ) external returns (uint256 nftTokenId, uint256 payTokenAmount);

  function mortgageAdd(uint256 nftTokenId, uint256 tokenAmount) external returns (uint256 payTokenAmount);

  function redeem(uint256 nftTokenId, uint256 tokenAmount) external payable returns (uint256 payTokenAmount);

  function multiply(
    string memory tid,
    uint256 multiplyAmount
  ) external payable returns (uint256 nftTokenId, uint256 payTokenAmount);

  function multiplyNew(
    string memory tid,
    uint256 multiplyAmount
  ) external payable returns (uint256 nftTokenId, uint256 payTokenAmount);

  function multiplyAdd(uint256 nftTokenId, uint256 multiplyAmount) external payable returns (uint256 payTokenAmount);

  function cash(uint256 nftTokenId, uint256 tokenAmount) external returns (uint256 payTokenAmount);

  function merge(uint256 nftTokenId, uint256 otherNFTTokenId) external returns (uint256 payTokenAmount);

  function split(
    uint256 nftTokenId,
    uint256 splitAmount
  ) external payable returns (uint256 payTokenAmount, uint256 newNFTTokenId);
}
