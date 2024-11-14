// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./interfaces/IDegenGate.sol";
import "./interfaces/IMarket.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/IPoint.sol";
import "./interfaces/IMortgageNFT.sol";

contract HypeMeme is Initializable, OwnableUpgradeable {
  struct TokenInfo {
    string name;
    string ticker;
    string description;
    string image;
    string twitterLink;
    string telegramLink;
    string warpcastLink;
    string website;
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
  address public degenGate;

  uint256 public nftPrice;
  address public fundRecipient;
  address public signatureAddress;

  mapping(uint256 boxId => uint256 used) public boxUsed;

  bool public isSystemReady;

  event CreateTokenWithBox(
    string tid,
    TokenInfo info,
    uint256 nftPrice,
    WrapInfo wrap,
    uint256 nftTokenId,
    address sender
  );
  event MultiplyWithBox(
    string tid,
    uint256 multiplyAmount,
    WrapInfo wrap,
    uint256 mortgageNFTtokenId,
    uint256 payTokenAmount,
    address sender
  );
  event CreateTokenAndMultiplyWithBox(
    string tid,
    TokenInfo info,
    uint256 nftPrice,
    uint256 multiplyAmount,
    WrapInfo wrap,
    uint256 nftTokenId,
    uint256 mortgageNFTtokenId,
    uint256 payTokenAmount,
    address sender
  );

  event CreateToken(string tid, TokenInfo info, uint256 nftPrice, uint256 nftTokenId, address sender);
  event Multiply(
    string tid,
    uint256 multiplyAmount,
    uint256 payTokenAmountMax,
    uint256 mortgageNFTtokenId,
    uint256 payTokenAmount,
    address sender
  );
  event CreateTokenAndMultiply(
    string tid,
    TokenInfo info,
    uint256 nftPrice,
    uint256 multiplyAmount,
    uint256 payTokenAmountMax,
    uint256 nftTokenId,
    uint256 mortgageNFTtokenId,
    uint256 payTokenAmount,
    address sender
  );

  event Cash(uint256 tokenId, uint256 tokenAmount, uint256 payTokenAmount, address sender);

  event SetNftPrice(uint256 _nftPrice, address sender);
  event SetFundRecipient(address _fundRecipient, address sender);
  event SetSignatureAddress(address _signatureAddress, address sender);

  modifier checkTimestamp(uint256 deadline) {
    require(block.timestamp <= deadline, "CTE");
    _;
  }

  modifier onlyWhenSystemReady() {
    require(isSystemReady, "SRE");
    _;
  }

  function initialize(
    address _foundry,
    uint256 _appId,
    address _mortgageNFT,
    address _market,
    address _degen,
    address _degenGate,
    uint256 _nftPrice,
    address _fundRecipient,
    address _signatureAddress
  ) public initializer {
    foundry = _foundry;
    appId = _appId;
    mortgageNFT = _mortgageNFT;
    market = _market;
    degen = _degen;
    degenGate = _degenGate;

    nftPrice = _nftPrice;
    fundRecipient = _fundRecipient;
    signatureAddress = _signatureAddress;

    __Ownable_init(msg.sender);
  }

  function createTokenWithBox(
    TokenInfo memory info,
    WrapInfo memory wrap,
    uint256 boxId,
    uint256 boxTotalAmount,
    uint256 deadline,
    bytes memory signature
  ) external checkTimestamp(deadline) onlyWhenSystemReady {
    _verifyCreateTokenWithBoxSignature(info, wrap, boxId, boxTotalAmount, deadline, signature);

    require(boxUsed[boxId] + wrap.specialPointAmount <= boxTotalAmount, "BE");
    boxUsed[boxId] += wrap.specialPointAmount;

    (string memory tid, uint256[] memory nftTokenIds) = _createTokenWithoutPay(info);

    require(wrap.degenAmount + wrap.specialPointAmount >= nftPrice, "PE");

    if (nftPrice > wrap.specialPointAmount) {
      uint256 part = nftPrice - wrap.specialPointAmount;
      _TFDegenFromSender(address(this), part);
      _approveDegenToDegenGate();
      IDegenGate(degenGate).degenToPoint(part);
      _transferPoint(fundRecipient, part);

      if (wrap.specialPointAmount > 0) {
        IDegenGate(degenGate).boxMintPoint(fundRecipient, wrap.specialPointAmount);
      }
    } else {
      if (nftPrice > 0) {
        IDegenGate(degenGate).boxMintPoint(fundRecipient, nftPrice);
      }
    }

    emit CreateTokenWithBox(tid, info, nftPrice, wrap, nftTokenIds[0], msg.sender);
  }

  function multiplyWithBox(
    string memory tid,
    uint256 multiplyAmount,
    WrapInfo memory wrap,
    uint256 boxId,
    uint256 boxTotalAmount,
    uint256 deadline,
    bytes memory signature
  ) external checkTimestamp(deadline) onlyWhenSystemReady returns (uint256 mortgageNFTtokenId, uint256 payTokenAmount) {
    _verifyMultiplyWithBoxSignature(tid, multiplyAmount, wrap, boxId, boxTotalAmount, deadline, signature);

    require(boxUsed[boxId] + wrap.specialPointAmount <= boxTotalAmount, "BE");
    boxUsed[boxId] += wrap.specialPointAmount;

    (mortgageNFTtokenId, payTokenAmount) = _multiplyWithBox(tid, multiplyAmount, wrap);
  }

  function createTokenAndMultiplyWithBox(
    TokenInfo memory info,
    uint256 multiplyAmount,
    WrapInfo memory wrap,
    uint256 boxId,
    uint256 boxTotalAmount,
    uint256 deadline,
    bytes memory signature
  ) external checkTimestamp(deadline) onlyWhenSystemReady returns (uint256 mortgageNFTtokenId, uint256 payTokenAmount) {
    _verifyCreateTokenAndMultiplyWithBoxSignature(
      info,
      multiplyAmount,
      wrap,
      boxId,
      boxTotalAmount,
      deadline,
      signature
    );

    require(boxUsed[boxId] + wrap.specialPointAmount <= boxTotalAmount, "BE");
    boxUsed[boxId] += wrap.specialPointAmount;

    (string memory tid, uint256[] memory nftTokenIds) = _createTokenWithoutPay(info);

    if (wrap.degenAmount > 0) {
      SafeERC20.safeTransferFrom(IERC20(degen), msg.sender, address(this), wrap.degenAmount);
      _approveDegenToDegenGate();
      IDegenGate(degenGate).degenToPoint(wrap.degenAmount);
    }

    if (wrap.specialPointAmount > 0) {
      IDegenGate(degenGate).boxMintPoint(address(this), wrap.specialPointAmount);
    }

    _approvePointToMarket();
    (mortgageNFTtokenId, payTokenAmount) = IMarket(market).multiplyProxy(tid, multiplyAmount, msg.sender);

    payTokenAmount = nftPrice + payTokenAmount;
    require(wrap.degenAmount + wrap.specialPointAmount >= payTokenAmount, "PE");

    if (nftPrice > 0) {
      _transferPoint(fundRecipient, nftPrice);
    }

    _refundWrap(wrap, payTokenAmount);

    emit CreateTokenAndMultiplyWithBox(
      tid,
      info,
      nftPrice,
      multiplyAmount,
      wrap,
      nftTokenIds[0],
      mortgageNFTtokenId,
      payTokenAmount,
      msg.sender
    );
  }

  function createToken(TokenInfo memory info) external onlyWhenSystemReady {
    (string memory tid, uint256[] memory nftTokenIds) = _createTokenWithoutPay(info);

    if (nftPrice > 0) {
      _TFDegenFromSender(address(this), nftPrice);
      _approveDegenToDegenGate();
      IDegenGate(degenGate).degenToPoint(nftPrice);
      _transferPoint(fundRecipient, nftPrice);
    }

    emit CreateToken(tid, info, nftPrice, nftTokenIds[0], msg.sender);
  }

  function multiply(
    string memory tid,
    uint256 multiplyAmount,
    uint256 degenAmountMax
  ) external onlyWhenSystemReady returns (uint256 mortgageNFTtokenId, uint256 payTokenAmount) {
    (mortgageNFTtokenId, payTokenAmount) = _multiply(tid, multiplyAmount, degenAmountMax);
  }

  function createTokenAndMultiply(
    TokenInfo memory info,
    uint256 multiplyAmount,
    uint256 payTokenAmountMax
  ) external onlyWhenSystemReady returns (uint256 mortgageNFTtokenId, uint256 payTokenAmount) {
    SafeERC20.safeTransferFrom(IERC20(degen), msg.sender, address(this), payTokenAmountMax);
    _approveDegenToDegenGate();
    IDegenGate(degenGate).degenToPoint(payTokenAmountMax);

    (string memory tid, uint256[] memory nftTokenIds) = _createTokenWithoutPay(info);

    _approvePointToMarket();
    (mortgageNFTtokenId, payTokenAmount) = IMarket(market).multiplyProxy(tid, multiplyAmount, msg.sender);

    payTokenAmount = nftPrice + payTokenAmount;
    require(payTokenAmountMax >= payTokenAmount, "PE");

    if (nftPrice > 0) {
      _transferPoint(fundRecipient, nftPrice);
    }
    _refundDegen(payTokenAmountMax, payTokenAmount);

    emit CreateTokenAndMultiply(
      tid,
      info,
      nftPrice,
      multiplyAmount,
      payTokenAmountMax,
      nftTokenIds[0],
      mortgageNFTtokenId,
      payTokenAmount,
      msg.sender
    );
  }

  function cash(uint256 nftTokenId, uint256 tokenAmount) external onlyWhenSystemReady returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    payTokenAmount = IMarket(market).cashProxy(nftTokenId, tokenAmount);

    _approvePointToDegenGate();
    IDegenGate(degenGate).pointToDegen(payTokenAmount);
    SafeERC20.safeTransfer(IERC20(degen), msg.sender, payTokenAmount);

    emit Cash(nftTokenId, tokenAmount, payTokenAmount, msg.sender);
  }

  function setNftPrice(uint256 _nftPrice) external onlyOwner {
    nftPrice = _nftPrice;

    emit SetNftPrice(_nftPrice, msg.sender);
  }

  function setFundRecipient(address _fundRecipient) external onlyOwner {
    fundRecipient = _fundRecipient;

    emit SetFundRecipient(_fundRecipient, msg.sender);
  }

  function setSignatureAddress(address _signatureAddress) external onlyOwner {
    signatureAddress = _signatureAddress;

    emit SetSignatureAddress(_signatureAddress, msg.sender);
  }

  function setSystemReady(bool _ready) external onlyOwner {
    isSystemReady = _ready;
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

  function _createTokenWithoutPay(
    TokenInfo memory info
  ) private returns (string memory tid, uint256[] memory nftTokenIds) {
    require(bytes(info.name).length > 0, "INE");
    require(bytes(info.ticker).length > 0, "ITE");
    require(bytes(info.image).length > 0, "IIE");

    tid = info.ticker;

    nftTokenIds = IFoundry(foundry).createToken(
      appId,
      tid,
      _encodeTdata(info),
      _nftPercents(),
      _nftOwners(),
      new bytes[](1)
    );
  }

  function _encodeTdata(TokenInfo memory info) private view returns (bytes memory) {
    return
      abi.encode(
        info.name,
        info.ticker,
        info.description,
        info.image,
        info.twitterLink,
        info.telegramLink,
        info.warpcastLink,
        info.website,
        block.timestamp
      );
  }

  function _nftPercents() private pure returns (uint256[] memory) {
    uint256[] memory result = new uint256[](1);
    result[0] = 100000;
    return result;
  }

  function _nftOwners() private view returns (address[] memory) {
    address[] memory result = new address[](1);
    result[0] = _msgSender();
    return result;
  }

  function _multiplyWithBox(
    string memory tid,
    uint256 multiplyAmount,
    WrapInfo memory wrap
  ) private returns (uint256 mortgageNFTtokenId, uint256 payTokenAmount) {
    if (wrap.degenAmount > 0) {
      SafeERC20.safeTransferFrom(IERC20(degen), msg.sender, address(this), wrap.degenAmount);
      _approveDegenToDegenGate();
      IDegenGate(degenGate).degenToPoint(wrap.degenAmount);
    }
    if (wrap.specialPointAmount > 0) {
      IDegenGate(degenGate).boxMintPoint(address(this), wrap.specialPointAmount);
    }

    _approvePointToMarket();

    (bool exists, uint256 tokenId) = _find_first_mortgage(tid);
    if (exists) {
      mortgageNFTtokenId = tokenId;
      payTokenAmount = IMarket(market).multiplyAddProxy(mortgageNFTtokenId, multiplyAmount);
    } else {
      (mortgageNFTtokenId, payTokenAmount) = IMarket(market).multiplyProxy(tid, multiplyAmount, msg.sender);
    }

    _refundWrap(wrap, payTokenAmount);

    emit MultiplyWithBox(tid, multiplyAmount, wrap, mortgageNFTtokenId, payTokenAmount, msg.sender);
  }

  function _multiply(
    string memory tid,
    uint256 multiplyAmount,
    uint256 payTokenAmountMax
  ) private returns (uint256 mortgageNFTtokenId, uint256 payTokenAmount) {
    SafeERC20.safeTransferFrom(IERC20(degen), msg.sender, address(this), payTokenAmountMax);
    _approveDegenToDegenGate();
    IDegenGate(degenGate).degenToPoint(payTokenAmountMax);

    _approvePointToMarket();

    (bool exists, uint256 tokenId) = _find_first_mortgage(tid);
    if (exists) {
      mortgageNFTtokenId = tokenId;
      payTokenAmount = IMarket(market).multiplyAddProxy(mortgageNFTtokenId, multiplyAmount);
    } else {
      (mortgageNFTtokenId, payTokenAmount) = IMarket(market).multiplyProxy(tid, multiplyAmount, msg.sender);
    }

    _refundDegen(payTokenAmountMax, payTokenAmount);

    emit Multiply(tid, multiplyAmount, payTokenAmountMax, mortgageNFTtokenId, payTokenAmount, msg.sender);
  }

  function _verifyCreateTokenWithBoxSignature(
    TokenInfo memory info,
    WrapInfo memory wrap,
    uint256 boxId,
    uint256 boxTotalAmount,
    uint256 deadline,
    bytes memory signature
  ) private view {
    bytes32 raw = keccak256(abi.encode(info, wrap, boxId, boxTotalAmount, deadline, _msgSender()));
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

  function _verifyCreateTokenAndMultiplyWithBoxSignature(
    TokenInfo memory info,
    uint256 multiplyAmount,
    WrapInfo memory wrap,
    uint256 boxId,
    uint256 boxTotalAmount,
    uint256 deadline,
    bytes memory signature
  ) private view {
    bytes32 raw = keccak256(abi.encode(info, multiplyAmount, wrap, boxId, boxTotalAmount, deadline, _msgSender()));
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

    if (wrap.specialPointAmount >= needPay) {
      if (wrap.degenAmount > 0) {
        _approvePointToDegenGate();
        IDegenGate(degenGate).pointToDegen(wrap.degenAmount);
        SafeERC20.safeTransfer(IERC20(degen), msg.sender, wrap.degenAmount);
      }
      if (value - wrap.degenAmount > 0) {
        IPoint(point()).burnSender(value - wrap.degenAmount);
      }
    } else {
      _approvePointToDegenGate();
      IDegenGate(degenGate).pointToDegen(value);
      SafeERC20.safeTransfer(IERC20(degen), msg.sender, value);
    }
  }

  function _refundDegen(uint256 payMax, uint256 needPay) private {
    if (payMax > needPay) {
      uint256 refund = payMax - needPay;
      _approvePointToDegenGate();
      IDegenGate(degenGate).pointToDegen(refund);
      SafeERC20.safeTransfer(IERC20(degen), msg.sender, refund);
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

  function _approveDegenToDegenGate() private {
    if (IERC20(degen).allowance(address(this), degenGate) != type(uint256).max) {
      IERC20(degen).approve(degenGate, type(uint256).max);
    }
  }

  function _approvePointToDegenGate() private {
    if (IERC20(point()).allowance(address(this), degenGate) != type(uint256).max) {
      IERC20(point()).approve(degenGate, type(uint256).max);
    }
  }
}
