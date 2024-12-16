// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IMarket.sol";
import "../interfaces/IFoundry.sol";

contract AppOperator {
  address public immutable foundry;
  uint256 public immutable appId;
  address public immutable mortgageNFT;
  address public immutable market;

  constructor(address _foundry, uint256 _appId, address _mortgageNFT, address _market) {
    foundry = _foundry;
    appId = _appId;
    mortgageNFT = _mortgageNFT;
    market = _market;
  }

  function createToken(string memory tid, bytes memory tData, address cnftOnwer, address onftOwner) external payable {
    IFoundry(foundry).createToken(appId, tid, tData, _nftPercents(), _nftOwners(cnftOnwer, onftOwner), new bytes[](2));
  }

  function buy(
    string memory tid,
    uint256 tokenAmount,
    uint256 payTokenAmountMax
  ) external returns (uint256 payTokenAmount) {
    _transferFromERC20PayTokenFromSender(address(this), payTokenAmountMax);
    _approvePayTokenToMarket();
    // payTokenAmount = IMarket(market).buy(tid, tokenAmount, msg.sender);

    _refund(payTokenAmount, payTokenAmountMax);
  }

  function sell(string memory tid, uint256 tokenAmount) external returns (uint256 payTokenAmount) {
    // payTokenAmount = IMarket(market).sell(tid, tokenAmount, msg.sender);

    _transferToSender(payTokenAmount);
  }

  function mortgage(
    string memory tid,
    uint256 tokenAmount
  ) external returns (uint256 nftTokenId, uint256 payTokenAmount) {
    // (nftTokenId, payTokenAmount) = IMarket(market).mortgageProxy(tid, tokenAmount, msg.sender);

    _transferToSender(payTokenAmount);
  }

  function mortgageAdd(uint256 nftTokenId, uint256 tokenAmount) external returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    // payTokenAmount = IMarket(market).mortgageAddProxy(nftTokenId, tokenAmount);

    _transferToSender(payTokenAmount);
  }

  function redeem(
    uint256 nftTokenId,
    uint256 tokenAmount,
    uint256 payTokenAmountMax
  ) external returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    _transferFromERC20PayTokenFromSender(address(this), payTokenAmountMax);
    _approvePayTokenToMarket();
    // payTokenAmount = IMarket(market).redeemProxy(nftTokenId, tokenAmount);

    _refund(payTokenAmount, payTokenAmountMax);
  }

  function multiply(
    string memory tid,
    uint256 multiplyAmount,
    uint256 payTokenAmountMax
  ) external returns (uint256 nftTokenId, uint256 payTokenAmount) {
    _transferFromERC20PayTokenFromSender(address(this), payTokenAmountMax);
    _approvePayTokenToMarket();
    // (nftTokenId, payTokenAmount) = IMarket(market).multiplyProxy(tid, multiplyAmount, msg.sender);

    _refund(payTokenAmount, payTokenAmountMax);
  }

  function multiplyAdd(
    uint256 nftTokenId,
    uint256 multiplyAmount,
    uint256 payTokenAmountMax
  ) external returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    _transferFromERC20PayTokenFromSender(address(this), payTokenAmountMax);
    _approvePayTokenToMarket();
    // payTokenAmount = IMarket(market).multiplyAddProxy(nftTokenId, multiplyAmount);

    _refund(payTokenAmount, payTokenAmountMax);
  }

  function cash(uint256 nftTokenId, uint256 tokenAmount) external returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    // payTokenAmount = IMarket(market).cashProxy(nftTokenId, tokenAmount);

    _transferToSender(payTokenAmount);
  }

  function merge(uint256 nftTokenId, uint256 otherNFTTokenId) external returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE1");
    require(IERC721(mortgageNFT).ownerOf(otherNFTTokenId) == msg.sender, "AOE2");

    // payTokenAmount = IMarket(market).mergeProxy(nftTokenId, otherNFTTokenId);

    _transferToSender(payTokenAmount);
  }

  function split(
    uint256 nftTokenId,
    uint256 splitAmount,
    uint256 payTokenAmountMax
  ) external returns (uint256 payTokenAmount, uint256 newNFTTokenId) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    _transferFromERC20PayTokenFromSender(address(this), payTokenAmountMax);
    _approvePayTokenToMarket();
    // (payTokenAmount, newNFTTokenId) = IMarket(market).splitProxy(nftTokenId, splitAmount);

    _refund(payTokenAmount, payTokenAmountMax);
  }

  function payToken() public view returns (address) {
    return IMarket(market).payToken();
  }

  function _transferToSender(uint256 payTokenAmount) private {
    _transferTo(msg.sender, payTokenAmount);
  }

  function _refund(uint256 payTokenAmount, uint256 payTokenAmountMax) private {
    require(payTokenAmountMax >= payTokenAmount, "PE");
    _refundPayToken(payTokenAmountMax, payTokenAmount);
  }

  function _transferTo(address to, uint256 payTokenAmount) private {
    _transferERC20PayToken(to, payTokenAmount);
  }

  function _payTokenIsERC20() private view returns (bool) {
    return payToken() != address(0);
  }

  function _nftPercents() private pure returns (uint256[] memory) {
    uint256[] memory result = new uint256[](2);
    result[0] = 5000;
    result[1] = 95000;
    return result;
  }

  function _nftOwners(address cOwner, address oOwner) private pure returns (address[] memory) {
    address[] memory result = new address[](2);
    result[0] = cOwner;
    result[1] = oOwner;
    return result;
  }

  function _refundPayToken(uint256 payMax, uint256 needPay) private {
    uint256 refund = payMax - needPay;
    if (refund > 0) {
      _transferERC20PayToken(msg.sender, refund);
    }
  }

  function _transferERC20PayToken(address to, uint256 value) private {
    SafeERC20.safeTransfer(IERC20(payToken()), to, value);
  }

  function _transferFromERC20PayTokenFromSender(address to, uint256 value) private {
    SafeERC20.safeTransferFrom(IERC20(payToken()), msg.sender, to, value);
  }

  function _approvePayTokenToMarket() private {
    if (IERC20(payToken()).allowance(address(this), market) != type(uint256).max) {
      IERC20(payToken()).approve(market, type(uint256).max);
    }
  }

  receive() external payable {}
}
