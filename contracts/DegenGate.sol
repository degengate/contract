// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IMarket.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/INFTClaim.sol";
import "./interfaces/IBegen.sol";

contract DegenGate is Ownable {
  using ECDSA for bytes32;

  struct TokenInfo {
    string tid;
    string tName;
    string cid;
    string cName;
    uint256 followers;
    uint256 omf;
  }

  struct WrapInfo {
    uint256 degenAmount;
    uint256 specialBegenAmount;
  }

  address public immutable foundry;
  uint256 public immutable appId;
  address public immutable mortgageNFT;
  address public immutable market;
  address public immutable degen;
  address public immutable vault;

  address public nftClaim;
  address public fundRecipient;
  address public signatureAddress;

  event CreateTokenWrap(
    TokenInfo info,
    WrapInfo wrap,
    uint256 cNFTTokenId,
    uint256 oNFTTokenId,
    uint256 nftPrice,
    uint256 deadline,
    address sender
  );
  event Multiply(
    uint256 tokenId,
    string tid,
    uint256 multiplyAmount,
    uint256 payTokenAmount,
    WrapInfo wrap,
    address sender
  );
  event MultiplyAdd(uint256 tokenId, uint256 multiplyAmount, uint256 payTokenAmount, WrapInfo wrap, address sender);
  event Cash(uint256 tokenId, uint256 tokenAmount, uint256 payTokenAmount, address sender);

  event CreateToken(
    TokenInfo info,
    uint256 cNFTTokenId,
    uint256 oNFTTokenId,
    uint256 nftPrice,
    uint256 deadline,
    address sender
  );
  event CreateTokenAndMultiply(
    TokenInfo info,
    uint256 cNFTTokenId,
    uint256 oNFTTokenId,
    uint256 nftPrice,
    uint256 deadline,
    uint256 multiplyAmount,
    uint256 tokenId,
    uint256 payTokenAmount,
    address sender
  );

  event SetFundRecipient(address _fundRecipient, address sender);
  event SetSignatureAddress(address _signatureAddress, address sender);

  modifier checkTimestamp(uint256 deadline) {
    require(block.timestamp <= deadline, "CTE");
    _;
  }

  constructor(
    address _foundry,
    uint256 _appId,
    address _mortgageNFT,
    address _market,
    address _degen,
    address _vault,
    address _nftClaim,
    address _fundRecipient,
    address _signatureAddress
  ) Ownable() {
    foundry = _foundry;
    appId = _appId;
    mortgageNFT = _mortgageNFT;
    market = _market;
    degen = _degen;
    vault = _vault;

    nftClaim = _nftClaim;
    fundRecipient = _fundRecipient;
    signatureAddress = _signatureAddress;
  }

  function createTokenWrap(
    TokenInfo memory info,
    WrapInfo memory wrap,
    uint256 nftPrice,
    uint256 deadline,
    bytes memory signature
  ) external checkTimestamp(deadline) {
    _verifyCreateTokenWrapSignature(info, wrap, nftPrice, deadline, signature);

    uint256[] memory nftTokenIds = _createTokenWithoutPay(info);

    require(wrap.degenAmount + wrap.specialBegenAmount >= nftPrice, "PE");

    if (nftPrice > wrap.specialBegenAmount) {
      _TFDegenFromSender(vault, nftPrice - wrap.specialBegenAmount);
    }
    IBegen(begen()).mint(fundRecipient, nftPrice);

    emit CreateTokenWrap(info, wrap, nftTokenIds[0], nftTokenIds[1], nftPrice, deadline, msg.sender);
  }

  function multiply(
    string memory tid,
    uint256 multiplyAmount,
    WrapInfo memory wrap,
    uint256 deadline,
    bytes memory signature
  ) external checkTimestamp(deadline) returns (uint256 nftTokenId, uint256 payTokenAmount) {
    _verifyMultiplySignature(tid, multiplyAmount, wrap, deadline, signature);

    _TFDegenFromSender(vault, wrap.degenAmount);
    IBegen(begen()).mint(address(this), wrap.degenAmount + wrap.specialBegenAmount);

    _approveBegenToMarket();
    (nftTokenId, payTokenAmount) = IMarket(market).multiplyProxy(tid, multiplyAmount, msg.sender);

    _refundWrap(wrap, payTokenAmount);

    emit Multiply(nftTokenId, tid, multiplyAmount, payTokenAmount, wrap, msg.sender);
  }

  function multiplyAdd(
    uint256 nftTokenId,
    uint256 multiplyAmount,
    WrapInfo memory wrap,
    uint256 deadline,
    bytes memory signature
  ) external checkTimestamp(deadline) returns (uint256 payTokenAmount) {
    _verifyMultiplyAddSignature(nftTokenId, multiplyAmount, wrap, deadline, signature);

    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    _TFDegenFromSender(vault, wrap.degenAmount);
    IBegen(begen()).mint(address(this), wrap.degenAmount + wrap.specialBegenAmount);

    _approveBegenToMarket();
    payTokenAmount = IMarket(market).multiplyAddProxy(nftTokenId, multiplyAmount);

    _refundWrap(wrap, payTokenAmount);

    emit MultiplyAdd(nftTokenId, multiplyAmount, payTokenAmount, wrap, msg.sender);
  }

  function cash(uint256 nftTokenId, uint256 tokenAmount) external returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    payTokenAmount = IMarket(market).cashProxy(nftTokenId, tokenAmount);

    IBegen(begen()).burnSender(payTokenAmount);
    _TFDegenFromVault(msg.sender, payTokenAmount);

    emit Cash(nftTokenId, tokenAmount, payTokenAmount, msg.sender);
  }

  function createToken(
    TokenInfo memory info,
    uint256 nftPrice,
    uint256 deadline,
    bytes memory signature
  ) external checkTimestamp(deadline) {
    _verifySignature(info, nftPrice, deadline, signature);

    uint256[] memory nftTokenIds = _createTokenWithoutPay(info);

    if (nftPrice > 0) {
      _TFBegenFromSender(fundRecipient, nftPrice);
    }

    emit CreateToken(info, nftTokenIds[0], nftTokenIds[1], nftPrice, deadline, msg.sender);
  }

  function createTokenAndMultiply(
    TokenInfo memory info,
    uint256 nftPrice,
    uint256 deadline,
    bytes memory signature,
    uint256 multiplyAmount,
    uint256 payTokenAmountMax
  ) external checkTimestamp(deadline) returns (uint256 payTokenAmount) {
    _verifySignature(info, nftPrice, deadline, signature);

    uint256[] memory nftTokenIds = _createTokenWithoutPay(info);

    uint256 tokenId;

    _TFBegenFromSender(address(this), payTokenAmountMax);
    _approveBegenToMarket();
    (tokenId, payTokenAmount) = IMarket(market).multiplyProxy(info.tid, multiplyAmount, msg.sender);

    payTokenAmount = nftPrice + payTokenAmount;

    require(payTokenAmountMax >= payTokenAmount, "PE");
    if (nftPrice > 0) {
      _transferBegen(fundRecipient, nftPrice);
    }
    _refundBegen(payTokenAmountMax, payTokenAmount);

    emit CreateTokenAndMultiply(
      info,
      nftTokenIds[0],
      nftTokenIds[1],
      nftPrice,
      deadline,
      multiplyAmount,
      tokenId,
      payTokenAmount,
      msg.sender
    );
  }

  function setFundRecipient(address _fundRecipient) external onlyOwner {
    fundRecipient = _fundRecipient;

    emit SetFundRecipient(_fundRecipient, msg.sender);
  }

  function setSignatureAddress(address _signatureAddress) external onlyOwner {
    signatureAddress = _signatureAddress;

    emit SetSignatureAddress(_signatureAddress, msg.sender);
  }

  function begen() public view returns (address) {
    return IMarket(market).payToken();
  }

  function _createTokenWithoutPay(TokenInfo memory info) private returns (uint256[] memory nftTokenIds) {
    address oNFTOwner;
    if (keccak256(abi.encodePacked(info.tid)) == keccak256(abi.encodePacked(info.cid))) {
      oNFTOwner = _msgSender();
    } else {
      oNFTOwner = nftClaim;
    }

    nftTokenIds = IFoundry(foundry).createToken(
      appId,
      info.tid,
      _encodeTdata(info.tName, info.cid, info.cName, info.followers, info.omf),
      _nftPercents(),
      _nftOwners(_msgSender(), oNFTOwner),
      new bytes[](2)
    );

    if (_msgSender() == oNFTOwner) {
      INFTClaim(nftClaim).setClaim(info.tid);
    }
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

  function _encodeTdata(
    string memory tTwitterName,
    string memory cid,
    string memory cTwitterName,
    uint256 followers,
    uint256 omf
  ) private view returns (bytes memory) {
    return abi.encode(tTwitterName, cid, cTwitterName, followers, omf, block.timestamp);
  }

  function _verifySignature(
    TokenInfo memory info,
    uint256 nftPrice,
    uint256 deadline,
    bytes memory signature
  ) private view {
    bytes32 raw = keccak256(abi.encode(info, nftPrice, deadline, _msgSender()));
    require(SignatureChecker.isValidSignatureNow(signatureAddress, raw.toEthSignedMessageHash(), signature), "VSE");
  }

  function _verifyCreateTokenWrapSignature(
    TokenInfo memory info,
    WrapInfo memory wrap,
    uint256 nftPrice,
    uint256 deadline,
    bytes memory signature
  ) private view {
    bytes32 raw = keccak256(abi.encode(info, wrap, nftPrice, deadline, _msgSender()));
    require(SignatureChecker.isValidSignatureNow(signatureAddress, raw.toEthSignedMessageHash(), signature), "VSE");
  }

  function _verifyMultiplySignature(
    string memory tid,
    uint256 multiplyAmount,
    WrapInfo memory wrap,
    uint256 deadline,
    bytes memory signature
  ) private view {
    bytes32 raw = keccak256(abi.encode(tid, multiplyAmount, wrap, deadline, _msgSender()));
    require(SignatureChecker.isValidSignatureNow(signatureAddress, raw.toEthSignedMessageHash(), signature), "VSE");
  }

  function _verifyMultiplyAddSignature(
    uint256 nftTokenId,
    uint256 multiplyAmount,
    WrapInfo memory wrap,
    uint256 deadline,
    bytes memory signature
  ) private view {
    bytes32 raw = keccak256(abi.encode(nftTokenId, multiplyAmount, wrap, deadline, _msgSender()));
    require(SignatureChecker.isValidSignatureNow(signatureAddress, raw.toEthSignedMessageHash(), signature), "VSE");
  }

  function _refundWrap(WrapInfo memory wrap, uint256 needPay) private {
    uint256 wrapMax = wrap.degenAmount + wrap.specialBegenAmount;

    if (wrapMax <= needPay) {
      return;
    }

    uint256 value = wrapMax - needPay;
    IBegen(begen()).burnSender(value);

    if (wrap.specialBegenAmount >= needPay) {
      _TFDegenFromVault(msg.sender, wrap.degenAmount);
    } else {
      _TFDegenFromVault(msg.sender, value);
    }
  }

  function _refundBegen(uint256 payMax, uint256 needPay) private {
    if (payMax > needPay) {
      uint256 refund = payMax - needPay;
      _transferBegen(msg.sender, refund);
    }
  }

  function _TFDegenFromVault(address to, uint256 value) private {
    if (value > 0) {
      SafeERC20.safeTransferFrom(IERC20(degen), vault, to, value);
    }
  }

  function _TFBegenFromSender(address to, uint256 value) private {
    if (value > 0) {
      SafeERC20.safeTransferFrom(IERC20(begen()), msg.sender, to, value);
    }
  }

  function _TFDegenFromSender(address to, uint256 value) private {
    if (value > 0) {
      SafeERC20.safeTransferFrom(IERC20(degen), msg.sender, to, value);
    }
  }

  function _transferBegen(address to, uint256 value) private {
    if (value > 0) {
      SafeERC20.safeTransfer(IERC20(begen()), to, value);
    }
  }

  function _approveBegenToMarket() private {
    if (IERC20(begen()).allowance(address(this), market) != type(uint256).max) {
      IERC20(begen()).approve(market, type(uint256).max);
    }
  }
}
