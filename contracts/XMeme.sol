// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IMarket.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/IFeeNFT.sol";

contract XMeme is ERC721Holder, Initializable, OwnableUpgradeable {
  address public foundry;
  uint256 public appId;
  address public feeNFT;
  address public mortgageNFT;
  address public market;

  uint256 public firstBuyFee;
  address public fundRecipient;
  address public signatureAddress;

  bool public isSystemReady;

  // tid => claim
  mapping(string => bool) public isClaim;

  event CreateTokenAndMultiply(
    string tid,
    uint256 multiplyAmount,
    address token,
    uint256 onftTokenId,
    uint256 mortgageNFTtokenId,
    uint256 firstBuyFee,
    uint256 payEthAmount,
    address sender
  );

  event CreateTokenAndBuy(
    string tid,
    uint256 tokenAmount,
    address token,
    uint256 onftTokenId,
    uint256 firstBuyFee,
    uint256 payEthAmount,
    address sender
  );

  event Claim(string tid, address token, uint256 onftTokenId, address sender);

  event SetFirstBuyFee(uint256 firstBuyFee, address sender);
  event SetFundRecipient(address fundRecipient, address sender);
  event SetSignatureAddress(address _signatureAddress, address sender);
  event Collect(uint256 amount, address fundRecipient, address sender);

  modifier onlyWhenSystemReady() {
    require(isSystemReady, "SRE");
    _;
  }

  function initialize(
    address _foundry,
    uint256 _appId,
    address _feeNFT,
    address _mortgageNFT,
    address _market,
    uint256 _firstBuyFee,
    address _fundRecipient,
    address _signatureAddress
  ) public initializer {
    foundry = _foundry;
    appId = _appId;
    feeNFT = _feeNFT;
    mortgageNFT = _mortgageNFT;
    market = _market;

    firstBuyFee = _firstBuyFee;
    fundRecipient = _fundRecipient;
    signatureAddress = _signatureAddress;

    __Ownable_init(msg.sender);
  }

  function tokenIsCreated(string memory tid) public view returns (bool) {
    return IFoundry(foundry).tokenExist(appId, tid);
  }

  function setSystemReady(bool _isSystemReady) external onlyOwner {
    isSystemReady = _isSystemReady;
  }

  function createTokenAndMultiply(
    string memory tid,
    uint256 multiplyAmount
  ) external payable onlyWhenSystemReady returns (uint256 mortgageNFTtokenId, uint256 payEthAmount) {
    (address token, uint256 onftTokenId) = _createTokenWithoutPay(tid);

    (mortgageNFTtokenId, payEthAmount) = IMarket(market).multiplyNew{value: msg.value}(tid, multiplyAmount);

    payEthAmount = payEthAmount + firstBuyFee;

    require(msg.value >= payEthAmount, "VE");
    _transferEth(fundRecipient, firstBuyFee);
    _refundETH(payEthAmount);

    IERC721(mortgageNFT).safeTransferFrom(address(this), msg.sender, mortgageNFTtokenId);

    emit CreateTokenAndMultiply(
      tid,
      multiplyAmount,
      token,
      onftTokenId,
      mortgageNFTtokenId,
      firstBuyFee,
      payEthAmount,
      msg.sender
    );
  }

  function createTokenAndBuy(
    string memory tid,
    uint256 tokenAmount
  ) external payable onlyWhenSystemReady returns (uint256 payEthAmount) {
    (address token, uint256 onftTokenId) = _createTokenWithoutPay(tid);

    (payEthAmount) = IMarket(market).buy{value: msg.value}(tid, tokenAmount);

    payEthAmount = payEthAmount + firstBuyFee;

    require(msg.value >= payEthAmount, "VE");
    _transferEth(fundRecipient, firstBuyFee);
    _refundETH(payEthAmount);

    SafeERC20.safeTransfer(IERC20(token), msg.sender, tokenAmount);

    emit CreateTokenAndBuy(tid, tokenAmount, token, onftTokenId, firstBuyFee, payEthAmount, msg.sender);
  }

  function claim(string memory tid, bytes memory signature) external onlyWhenSystemReady {
    require(!isClaim[tid], "CE");
    _verifyClaimSignature(tid, signature);

    isClaim[tid] = true;

    address token;
    uint256 onftTokenId;
    if (tokenIsCreated(tid)) {
      token = IFoundry(foundry).token(appId, tid);
      onftTokenId = _findOnftTokenIdByTid(tid);
    } else {
      (token, onftTokenId) = _createTokenWithoutPay(tid);
    }

    IERC721(feeNFT).safeTransferFrom(address(this), msg.sender, onftTokenId);
    emit Claim(tid, token, onftTokenId, msg.sender);
  }

  function setFirstBuyFee(uint256 _firstBuyFee) external onlyOwner {
    firstBuyFee = _firstBuyFee;

    emit SetFirstBuyFee(_firstBuyFee, msg.sender);
  }

  function setFundRecipient(address _fundRecipient) external onlyOwner {
    fundRecipient = _fundRecipient;

    emit SetFundRecipient(_fundRecipient, msg.sender);
  }

  function setSignatureAddress(address _signatureAddress) external onlyOwner {
    signatureAddress = _signatureAddress;

    emit SetSignatureAddress(_signatureAddress, msg.sender);
  }

  function collect(uint256 amount) external onlyOwner {
    _transferEth(fundRecipient, amount);

    emit Collect(amount, fundRecipient, msg.sender);
  }

  function _createTokenWithoutPay(string memory tid) private returns (address token, uint256 onftTokenId) {
    uint256[] memory nftTokenIds;
    (token, nftTokenIds) = IFoundry(foundry).createToken(
      appId,
      tid,
      bytes(""),
      _nftPercents(),
      _nftOwners(),
      new bytes[](1)
    );
    onftTokenId = nftTokenIds[0];
  }

  function _nftPercents() private pure returns (uint256[] memory) {
    uint256[] memory result = new uint256[](1);
    result[0] = 100000;
    return result;
  }

  function _nftOwners() private view returns (address[] memory) {
    address[] memory result = new address[](1);
    result[0] = address(this);
    return result;
  }

  function _verifyClaimSignature(string memory tid, bytes memory signature) private view {
    bytes32 raw = keccak256(abi.encode(tid, msg.sender));

    require(
      SignatureChecker.isValidSignatureNow(signatureAddress, MessageHashUtils.toEthSignedMessageHash(raw), signature),
      "VSE"
    );
  }

  function _findOnftTokenIdByTid(string memory tid) private view returns (uint256 tokenId) {
    (uint256[] memory tokenIds, , , ) = IFeeNFT(feeNFT).tidToInfos(tid);
    require(tokenIds.length == 1, "TE1");
    tokenId = tokenIds[0];
    require(tokenId != 0, "TE2");
  }

  function _refundETH(uint256 needPay) private {
    if (msg.value > needPay) {
      uint256 refund = msg.value - needPay;
      _transferEth(msg.sender, refund);
    }
  }

  function _transferEth(address to, uint256 value) private {
    if (value > 0) {
      (bool success, ) = to.call{value: value}(new bytes(0));
      require(success, "TEE");
    }
  }

  receive() external payable {}
}
