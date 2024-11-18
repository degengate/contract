// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/INFTView.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/IPublicNFT.sol";

contract HypeMemePublicNFTView is INFTView, Ownable {
  struct Info {
    string tid;
    string name;
    string ticker;
    string image;
    uint256 percent;
  }

  address public immutable foundry;
  uint256 public immutable appId;
  address public immutable publicNFT;

  string public imageUrlPrefix;

  constructor(address _foundry, uint256 _appId, address _publicNFT) Ownable(msg.sender) {
    foundry = _foundry;
    appId = _appId;
    publicNFT = _publicNFT;
  }

  function name() external pure override returns (string memory) {
    return "HypeMeme Tax";
  }

  function symbol() external pure override returns (string memory) {
    return "HMT";
  }

  function tokenURI(uint256 tokenId) external view override returns (string memory) {
    return _pack(tokenId);
  }

  function setImageUrlPrefix(string memory _imageUrlPrefix) external onlyOwner {
    imageUrlPrefix = _imageUrlPrefix;
  }

  function _getInfo(uint256 tokenId) private view returns (Info memory info) {
    (info.tid, info.percent, , ) = IPublicNFT(publicNFT).tokenIdToInfo(tokenId);

    bytes memory data = IFoundry(foundry).tokenData(appId, info.tid);
    (info.name, info.ticker, , info.image, , , , , ) = abi.decode(
      data,
      (string, string, string, string, string, string, string, string, uint256)
    );
  }

  function _pack(uint256 tokenId) private view returns (string memory output) {
    Info memory info = _getInfo(tokenId);

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "',
            info.ticker,
            '", "description": "',
            _desc(info),
            '", "image": "',
            _image(tokenId),
            '", "metadata": {"name": "',
            info.name,
            '", "ticker": "',
            info.ticker,
            '", "percent": ',
            Strings.toString(info.percent),
            ', "image": "',
            info.image,
            '"}}'
          )
        )
      )
    );
    output = string(abi.encodePacked("data:application/json;base64,", json));
  }

  function _desc(Info memory info) private pure returns (string memory) {
    string memory part1;
    string memory part2;
    if (info.percent == 37500) {
      part1 = "The HypeMeme team";
      part2 = "0.6";
    } else {
      part1 = "The coin creator";
      part2 = "1";
    }

    return
      string(
        abi.encodePacked(
          part1,
          " will automatically receive this tradable NFT, which grants holders ",
          part2,
          "% ownership of trade fees from ",
          info.ticker,
          " as a certificate."
        )
      );
  }

  function _image(uint256 tokenId) private view returns (string memory) {
    return string(abi.encodePacked(imageUrlPrefix, Strings.toString(tokenId)));
  }
}
