// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IPublicNFT.sol";
import "./interfaces/INFTClaim.sol";
import "./interfaces/IPublicNFTVault.sol";
import "./interfaces/IMarket.sol";

contract DegenGateNFTClaim is INFTClaim, IPublicNFTVault, ERC165, Ownable, ERC721Holder {
  address public immutable degenGate;
  address public immutable publicNFT;
  address public immutable market;
  address public signatureAddress;
  // tid => claim
  mapping(string => bool) public override isClaim;

  event SetSignatureAddress(address _signatureAddress, address sender);
  event ClaimNFT(string tid, uint256 tokenId, address nftOwner, address sender);
  event ReceiveBuySellFee(uint256 tokenId, uint256 amount);

  constructor(address _degenGate, address _publicNFT, address _market, address _signatureAddress) Ownable(msg.sender) {
    degenGate = _degenGate;
    publicNFT = _publicNFT;
    market = _market;
    signatureAddress = _signatureAddress;
  }

  function setSignatureAddress(address _signatureAddress) external onlyOwner {
    signatureAddress = _signatureAddress;

    emit SetSignatureAddress(_signatureAddress, msg.sender);
  }

  function setClaim(string memory tid) external override {
    require(msg.sender == degenGate, "SE");

    isClaim[tid] = true;
    emit SetClaim(tid);
  }

  function claimNFT(string memory tid, address nftOwner, bytes memory signature) external {
    require(!isClaim[tid], "CE");

    _verifyClaimSignature(tid, nftOwner, signature);
    isClaim[tid] = true;

    uint256 tokenId = _findTokenIdByTid(tid);

    IERC721(publicNFT).safeTransferFrom(address(this), nftOwner, tokenId);

    emit ClaimNFT(tid, tokenId, nftOwner, msg.sender);
  }

  function recordReceiveBuySellFee(uint256 tokenId, uint256 amount) external override returns (bool) {
    require(msg.sender == market, "SE");

    (string memory tid1, uint256 percent1, , ) = IPublicNFT(publicNFT).tokenIdToInfo(tokenId);
    (string memory tid2, uint256 percent2, , ) = IPublicNFT(publicNFT).tokenIdToInfo(tokenId - 1);
    require(percent1 == 95000, "OPE");
    require(percent2 == 5000, "CPE");
    require(keccak256(abi.encodePacked(tid1)) == keccak256(abi.encodePacked(tid2)), "TE");

    _transferBegen(IERC721(publicNFT).ownerOf(tokenId - 1), amount);

    emit ReceiveBuySellFee(tokenId, amount);
    return true;
  }

  function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
    return interfaceId == type(IPublicNFTVault).interfaceId || super.supportsInterface(interfaceId);
  }

  function begen() public view returns (address) {
    return IMarket(market).payToken();
  }

  function _findTokenIdByTid(string memory tid) private view returns (uint256 tokenId) {
    (uint256[] memory tokenIds, uint256[] memory percents, , ) = IPublicNFT(publicNFT).tidToInfos(tid);
    require(tokenIds.length == 2, "TE1");

    for (uint256 i = 0; i < tokenIds.length; i++) {
      if (percents[i] == 95000) {
        tokenId = tokenIds[i];
        break;
      }
    }

    require(tokenId != 0, "TE2");
  }

  function _transferBegen(address to, uint256 value) private {
    SafeERC20.safeTransfer(IERC20(begen()), to, value);
  }

  function _verifyClaimSignature(string memory tid, address nftOwner, bytes memory signature) private view {
    bytes32 raw = keccak256(abi.encode(tid, nftOwner));

    require(
      SignatureChecker.isValidSignatureNow(signatureAddress, MessageHashUtils.toEthSignedMessageHash(raw), signature),
      "VSE"
    );
  }

  fallback() external payable {}

  receive() external payable {}
}
