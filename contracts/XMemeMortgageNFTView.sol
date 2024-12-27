// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";

import "base64-sol/base64.sol";

import "./interfaces/INFTView.sol";
import "./interfaces/IMortgageNFT.sol";

contract XMemeMortgageNFTView is INFTView {
  struct Info {
    string tid;
    uint256 amount;
  }

  address public immutable mortgageNFT;

  constructor(address _mortgageNFT) {
    mortgageNFT = _mortgageNFT;
  }

  function name() external pure override returns (string memory) {
    return "X-meme Option";
  }

  function symbol() external pure override returns (string memory) {
    return "XMO";
  }

  function tokenURI(uint256 tokenId) external view override returns (string memory) {
    Info memory info = _getInfo(tokenId);

    string[5] memory parts;

    parts[
      0
    ] = '<svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="600" fill="#1E1E1E"/><rect width="600" height="600" fill="#1F1F1F"/><rect x="48" y="283" width="504" height="186" rx="16" fill="#292929"/><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="72" y="354.273">';

    parts[1] = info.tid;

    parts[
      2
    ] = '</tspan></text><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="85.7891" y="326.273"> ID</tspan></text><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="72" y="326.273">&#x1d54f;</tspan></text><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="72" y="402.273">Collateral Locked</tspan></text><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="28" font-weight="bold" letter-spacing="0em"><tspan x="72" y="438.182">';

    parts[3] = _getShowAmount(info.amount);

    parts[
      4
    ] = '</tspan></text><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="40" font-weight="500" letter-spacing="0em"><tspan x="35.9375" y="169.545">One</tspan></text><path d="M161.407 138.75H166.92L154.875 152.517L169.045 171.25H157.95L149.26 159.888L139.317 171.25H133.8L146.683 156.525L133.09 138.75H144.467L152.322 149.135L161.407 138.75ZM159.472 167.95H162.527L142.807 141.877H139.528L159.472 167.95Z" fill="white"/><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="40" font-weight="500" letter-spacing="0em"><tspan x="188.48" y="169.545">ID = One Memecoin</tspan></text></svg>';

    return _pack(tokenId, parts);
  }

  function _getShowAmount(uint256 amount) private pure returns (string memory) {
    uint256 _int = amount / (10 ** 18);
    return Strings.toString(_int);
  }

  function _getInfo(uint256 tokenId) private view returns (Info memory info) {
    (info.tid, info.amount) = IMortgageNFT(mortgageNFT).info(tokenId);
  }

  function _pack(uint256 tokenId, string[5] memory parts) private view returns (string memory output) {
    string memory partsOutput = string(abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4]));

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
    output = string(abi.encodePacked("data:application/json;base64,", json));
  }

  function _name(uint256 tokenId) private view returns (string memory) {
    Info memory info = _getInfo(tokenId);
    return string(abi.encodePacked(info.tid, " - #", Strings.toString(tokenId), " - ", _getShowAmount(info.amount)));
  }

  function _desc() private pure returns (string memory) {
    return
      string(
        abi.encodePacked(
          "This NFT represents a collateral option within the X-meme.\\n",
          unicode"⚠️ DISCLAIMER: Always perform due diligence before purchasing this NFT. Verify that the image reflects the correct number of option in the collateral. Refresh cached images on trading platforms to ensure you have the latest data."
        )
      );
  }
}
