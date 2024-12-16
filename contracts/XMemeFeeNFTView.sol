// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./utils/Base64.sol";

import "./interfaces/INFTView.sol";
import "./interfaces/IFeeNFT.sol";

contract XMemeFeeNFTView is INFTView, Ownable {
  struct Info {
    string tid;
    uint256 percent;
  }

  address public immutable foundry;
  uint256 public immutable appId;
  address public immutable feeNFT;

  string public urlPrefix;

  constructor(address _foundry, uint256 _appId, address _feeNFT) Ownable(msg.sender) {
    foundry = _foundry;
    appId = _appId;
    feeNFT = _feeNFT;
  }

  function name() external pure override returns (string memory) {
    return "XMeme Fee";
  }

  function symbol() external pure override returns (string memory) {
    return "XMF";
  }

  function tokenURI(uint256 tokenId) external view override returns (string memory) {
    return string(abi.encodePacked(urlPrefix, tokenId));
  }

  function setUrlPrefix(string memory _urlPrefix) external onlyOwner {
    urlPrefix = _urlPrefix;
  }
}
