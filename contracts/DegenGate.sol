// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IMarket.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/INFTClaim.sol";
import "./interfaces/IPoint.sol";
import "./interfaces/IMortgageNFT.sol";

contract DegenGate is Initializable, OwnableUpgradeable {
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
    uint256 specialPointAmount;
  }

  address public foundry;
  uint256 public appId;
  address public mortgageNFT;
  address public market;
  address public degen;
  address public vault;

  address public nftClaim;
  address public fundRecipient;
  address public signatureAddress;

  mapping(uint256 boxId => uint256 used) public boxUsed;

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

  function initialize(
    address _foundry,
    uint256 _appId,
    address _mortgageNFT,
    address _market,
    address _degen,
    address _vault,
    address _nftClaim,
    address _fundRecipient,
    address _signatureAddress
  ) public initializer {
    foundry = _foundry;
    appId = _appId;
    mortgageNFT = _mortgageNFT;
    market = _market;
    degen = _degen;
    vault = _vault;

    nftClaim = _nftClaim;
    fundRecipient = _fundRecipient;
    signatureAddress = _signatureAddress;

    __Ownable_init(msg.sender);
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

    require(wrap.degenAmount + wrap.specialPointAmount >= nftPrice, "PE");

    if (nftPrice > wrap.specialPointAmount) {
      _TFDegenFromSender(vault, nftPrice - wrap.specialPointAmount);
    }
    IPoint(point()).mint(fundRecipient, nftPrice);

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

    (nftTokenId, payTokenAmount) = _multiply(tid, multiplyAmount, wrap);
  }

  function multiplyWithBox(
    string memory tid,
    uint256 multiplyAmount,
    WrapInfo memory wrap,
    uint256 boxId,
    uint256 boxTotalAmount,
    uint256 deadline,
    bytes memory signature
  ) external checkTimestamp(deadline) returns (uint256 nftTokenId, uint256 payTokenAmount) {
    _verifyMultiplyWithBoxSignature(tid, multiplyAmount, wrap, boxId, boxTotalAmount, deadline, signature);

    require(boxUsed[boxId] + wrap.specialPointAmount <= boxTotalAmount, "BE");

    boxUsed[boxId] += wrap.specialPointAmount;

    (nftTokenId, payTokenAmount) = _multiply(tid, multiplyAmount, wrap);
  }

  function cash(uint256 nftTokenId, uint256 tokenAmount) external returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    payTokenAmount = IMarket(market).cashProxy(nftTokenId, tokenAmount);

    IPoint(point()).burnSender(payTokenAmount);
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
      _TFPointFromSender(fundRecipient, nftPrice);
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

    _TFPointFromSender(address(this), payTokenAmountMax);
    _approvePointToMarket();
    (tokenId, payTokenAmount) = IMarket(market).multiplyProxy(info.tid, multiplyAmount, msg.sender);

    payTokenAmount = nftPrice + payTokenAmount;

    require(payTokenAmountMax >= payTokenAmount, "PE");
    if (nftPrice > 0) {
      _transferPoint(fundRecipient, nftPrice);
    }
    _refundPoint(payTokenAmountMax, payTokenAmount);

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

  function point() public view returns (address) {
    return IMarket(market).payToken();
  }

  function _find_first_mortgage(string memory tid) private view returns (bool exists, uint256 tokenId) {
    IMortgageNFT.Info[] memory infos = IMortgageNFT(mortgageNFT).tokenInfosOfOwnerByTid(msg.sender, tid);
    if (infos.length == 0) {
      exists = false;
    } else {
      exists = true;
      tokenId = infos[0].tokenId;
      for (uint256 index = 0; index < infos.length; index++) {
        uint256 currentTokenId = infos[index].tokenId;
        if (currentTokenId < tokenId) {
          tokenId = currentTokenId;
        }
      }
    }
  }

  function _createTokenWithoutPay(TokenInfo memory info) private returns (uint256[] memory nftTokenIds) {
    nftTokenIds = IFoundry(foundry).createToken(
      appId,
      info.tid,
      _encodeTdata(info.tName, info.cid, info.cName, info.followers, info.omf),
      _nftPercents(),
      _nftOwners(_msgSender(), nftClaim),
      new bytes[](2)
    );
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
    string memory tName,
    string memory cid,
    string memory cName,
    uint256 followers,
    uint256 omf
  ) private view returns (bytes memory) {
    return abi.encode(tName, cid, cName, followers, omf, block.timestamp);
  }

  function _multiply(
    string memory tid,
    uint256 multiplyAmount,
    WrapInfo memory wrap
  ) private returns (uint256 nftTokenId, uint256 payTokenAmount) {
    _TFDegenFromSender(vault, wrap.degenAmount);
    IPoint(point()).mint(address(this), wrap.degenAmount + wrap.specialPointAmount);

    _approvePointToMarket();

    (bool exists, uint256 tokenId) = _find_first_mortgage(tid);
    if (exists) {
      nftTokenId = tokenId;
      payTokenAmount = IMarket(market).multiplyAddProxy(nftTokenId, multiplyAmount);
    } else {
      (nftTokenId, payTokenAmount) = IMarket(market).multiplyProxy(tid, multiplyAmount, msg.sender);
    }

    _refundWrap(wrap, payTokenAmount);

    emit Multiply(nftTokenId, tid, multiplyAmount, payTokenAmount, wrap, msg.sender);
  }

  function _verifySignature(
    TokenInfo memory info,
    uint256 nftPrice,
    uint256 deadline,
    bytes memory signature
  ) private view {
    bytes32 raw = keccak256(abi.encode(info, nftPrice, deadline, _msgSender()));

    require(
      SignatureChecker.isValidSignatureNow(signatureAddress, MessageHashUtils.toEthSignedMessageHash(raw), signature),
      "VSE"
    );
  }

  function _verifyCreateTokenWrapSignature(
    TokenInfo memory info,
    WrapInfo memory wrap,
    uint256 nftPrice,
    uint256 deadline,
    bytes memory signature
  ) private view {
    bytes32 raw = keccak256(abi.encode(info, wrap, nftPrice, deadline, _msgSender()));
    require(
      SignatureChecker.isValidSignatureNow(signatureAddress, MessageHashUtils.toEthSignedMessageHash(raw), signature),
      "VSE"
    );
  }

  function _verifyMultiplySignature(
    string memory tid,
    uint256 multiplyAmount,
    WrapInfo memory wrap,
    uint256 deadline,
    bytes memory signature
  ) private view {
    bytes32 raw = keccak256(abi.encode(tid, multiplyAmount, wrap, deadline, _msgSender()));
    require(
      SignatureChecker.isValidSignatureNow(signatureAddress, MessageHashUtils.toEthSignedMessageHash(raw), signature),
      "VSE"
    );
  }

  function _verifyMultiplyWithBoxSignature(
    string memory tid,
    uint256 multiplyAmount,
    WrapInfo memory wrap,
    uint256 boxId,
    uint256 boxTotalAmount,
    uint256 deadline,
    bytes memory signature
  ) private view {
    bytes32 raw = keccak256(abi.encode(tid, multiplyAmount, wrap, boxId, boxTotalAmount, deadline, _msgSender()));
    require(
      SignatureChecker.isValidSignatureNow(signatureAddress, MessageHashUtils.toEthSignedMessageHash(raw), signature),
      "VSE"
    );
  }

  function _refundWrap(WrapInfo memory wrap, uint256 needPay) private {
    uint256 wrapMax = wrap.degenAmount + wrap.specialPointAmount;

    if (wrapMax <= needPay) {
      return;
    }

    uint256 value = wrapMax - needPay;
    IPoint(point()).burnSender(value);

    if (wrap.specialPointAmount >= needPay) {
      _TFDegenFromVault(msg.sender, wrap.degenAmount);
    } else {
      _TFDegenFromVault(msg.sender, value);
    }
  }

  function _refundPoint(uint256 payMax, uint256 needPay) private {
    if (payMax > needPay) {
      uint256 refund = payMax - needPay;
      _transferPoint(msg.sender, refund);
    }
  }

  function _TFDegenFromVault(address to, uint256 value) private {
    if (value > 0) {
      SafeERC20.safeTransferFrom(IERC20(degen), vault, to, value);
    }
  }

  function _TFPointFromSender(address to, uint256 value) private {
    if (value > 0) {
      SafeERC20.safeTransferFrom(IERC20(point()), msg.sender, to, value);
    }
  }

  function _TFDegenFromSender(address to, uint256 value) private {
    if (value > 0) {
      SafeERC20.safeTransferFrom(IERC20(degen), msg.sender, to, value);
    }
  }

  function _transferPoint(address to, uint256 value) private {
    if (value > 0) {
      SafeERC20.safeTransfer(IERC20(point()), to, value);
    }
  }

  function _approvePointToMarket() private {
    if (IERC20(point()).allowance(address(this), market) != type(uint256).max) {
      IERC20(point()).approve(market, type(uint256).max);
    }
  }
}
