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
    string description;
    string image;
    string twitterLink;
    string telegramLink;
    string warpcastLink;
    string website;
    uint256 percent;
    uint256 timestamp;
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
    Info memory info = _getInfo(tokenId);

    string[11] memory parts;

    parts[
      0
    ] = '<svg width="528" height="528" viewBox="0 0 528 528" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="528" height="528" fill="#1E1E1E"/><image href="';
    parts[1] = _getImageUrl(info.image);
    parts[
      2
    ] = '" x="0" y="0" width="528" height="528" preserveAspectRatio="xMidYMid meet" /><rect x="15" y="364" width="500" height="148" rx="16" fill="#1F1F1F" fill-opacity="0.75"/><text fill="#DAFF7D" xml:space="preserve" style="white-space: pre" font-family="Courier Prime" font-size="20" font-weight="bold" letter-spacing="-0.011em"><tspan x="39" y="398.395">No.';
    parts[3] = Strings.toString(tokenId);
    parts[
      4
    ] = '</tspan></text><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Courier Prime" font-size="20" font-weight="bold" letter-spacing="-0.011em"><tspan x="39" y="430.395">';
    parts[5] = info.name;
    parts[
      6
    ] = '</tspan></text><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Courier Prime" font-size="20" font-weight="bold" letter-spacing="-0.011em"><tspan x="39" y="462.395">Ticker: ';

    parts[7] = info.ticker;
    parts[
      8
    ] = '</tspan></text><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Courier Prime" font-size="20" font-weight="bold" letter-spacing="-0.011em"><tspan x="39" y="494.395">';

    if (info.percent == 37500) {
      parts[9] = "0.6";
    } else {
      parts[9] = "1";
    }

    parts[10] = "% Trade Fee Ownership Certificate.</tspan></text></svg>";

    return _pack(tokenId, parts);
  }

  function setImageUrlPrefix(string memory _imageUrlPrefix) external onlyOwner {
    imageUrlPrefix = _imageUrlPrefix;
  }

  function _getImageUrl(string memory image) private view returns (string memory) {
    return string(abi.encodePacked(imageUrlPrefix, image));
  }

  function _getInfo(uint256 tokenId) private view returns (Info memory info) {
    (info.tid, info.percent, , ) = IPublicNFT(publicNFT).tokenIdToInfo(tokenId);

    bytes memory data = IFoundry(foundry).tokenData(appId, info.tid);
    (
      info.name,
      info.ticker,
      info.description,
      info.image,
      info.twitterLink,
      info.telegramLink,
      info.warpcastLink,
      info.website,
      info.timestamp
    ) = abi.decode(data, (string, string, string, string, string, string, string, string, uint256));
  }

  function _pack(uint256 tokenId, string[11] memory parts) private view returns (string memory output) {
    string memory partsOutput = string(
      abi.encodePacked(
        parts[0],
        parts[1],
        parts[2],
        parts[3],
        parts[4],
        parts[5],
        parts[6],
        parts[7],
        parts[8],
        parts[9],
        parts[10]
      )
    );

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "',
            _name(tokenId),
            '", "description": "',
            _desc(tokenId),
            '", "image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(partsOutput)),
            '"}'
          )
        )
      )
    );
    output = string(abi.encodePacked("data:application/json;base64,", json));
  }

  function _name(uint256 tokenId) private view returns (string memory) {
    Info memory info = _getInfo(tokenId);
    return info.ticker;
  }

  function _desc(uint256 tokenId) private view returns (string memory) {
    Info memory info = _getInfo(tokenId);

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
}
