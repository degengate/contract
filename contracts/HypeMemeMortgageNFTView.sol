// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/INFTView.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/IMortgageNFT.sol";

contract HypeMemeMortgageNFTView is INFTView, Ownable {
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
    uint256 timestamp;
    uint256 amount;
  }

  address public immutable foundry;
  uint256 public immutable appId;
  address public immutable mortgageNFT;

  string public imageUrlPrefix;

  constructor(address _foundry, uint256 _appId, address _mortgageNFT) Ownable(msg.sender) {
    foundry = _foundry;
    appId = _appId;
    mortgageNFT = _mortgageNFT;
  }

  function name() external pure override returns (string memory) {
    return "HM Option";
  }

  function symbol() external pure override returns (string memory) {
    return "HMO";
  }

  function tokenURI(uint256 tokenId) external view override returns (string memory) {
    Info memory info = _getInfo(tokenId);
    string[9] memory parts;

    parts[
      0
    ] = '<svg width="528" height="528" viewBox="0 0 528 528" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="528" height="528" fill="#1E1E1E"/><image href="';
    parts[1] = _getImageUrl(info.image);
    parts[
      2
    ] = '" x="0" y="0" width="528" height="528" preserveAspectRatio="xMidYMid meet" /><rect x="15" y="328" width="500" height="76" rx="16" fill="#1F1F1F" fill-opacity="0.75"/><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Courier Prime" font-size="20" font-weight="bold" letter-spacing="-0.011em"><tspan x="36" y="354.395">';
    parts[3] = info.name;
    parts[
      4
    ] = '</tspan></text><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Courier Prime" font-size="20" font-weight="bold" letter-spacing="-0.011em"><tspan x="36" y="386.395">Ticker: ';
    parts[5] = info.ticker;
    parts[
      6
    ] = '</tspan></text><rect x="15" y="412" width="500" height="100" rx="16" fill="#1F1F1F" fill-opacity="0.75"/><text fill="#9381FF" xml:space="preserve" style="white-space: pre" font-family="Courier Prime" font-size="24" font-weight="bold" letter-spacing="-0.011em"><tspan x="39" y="449.273">Collateral Locked</tspan></text><text fill="#DAFF7D" xml:space="preserve" style="white-space: pre" font-family="Courier Prime" font-size="32" font-weight="bold" letter-spacing="-0.011em"><tspan x="39" y="487.031">';
    parts[7] = _getShowAmount(info.amount);
    parts[8] = "</tspan></text></svg>";

    string memory partsOutput = string(
      abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8])
    );

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "',
            _name(tokenId),
            '", "description": "',
            _desc(),
            '", "image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(partsOutput)),
            '"}'
          )
        )
      )
    );
    return string(abi.encodePacked("data:application/json;base64,", json));
  }

  function setImageUrlPrefix(string memory _imageUrlPrefix) external onlyOwner {
    imageUrlPrefix = _imageUrlPrefix;
  }

  function _getImageUrl(string memory image) private view returns (string memory) {
    return string(abi.encodePacked(imageUrlPrefix, image));
  }

  function _getShowAmount(uint256 amount) private pure returns (string memory) {
    uint256 _int = amount / (10 ** 18);
    return Strings.toString(_int);
  }

  function _getInfo(uint256 tokenId) private view returns (Info memory info) {
    (info.tid, info.amount) = IMortgageNFT(mortgageNFT).info(tokenId);
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

  function _name(uint256 tokenId) private view returns (string memory) {
    Info memory info = _getInfo(tokenId);
    return string(abi.encodePacked(info.ticker, " - #", Strings.toString(tokenId), " - ", _getShowAmount(info.amount)));
  }

  function _desc() private pure returns (string memory) {
    return
      string(
        abi.encodePacked(
          "This NFT represents a collateral option within the HypeMeme.\\n",
          unicode"⚠️ DISCLAIMER: Always perform due diligence before purchasing this NFT. Verify that the image reflects the correct number of option in the collateral. Refresh cached images on trading platforms to ensure you have the latest data."
        )
      );
  }
}
