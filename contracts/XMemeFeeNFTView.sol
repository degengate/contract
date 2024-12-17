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
  }

  address public immutable feeNFT;

  constructor(address _feeNFT) Ownable(msg.sender) {
    feeNFT = _feeNFT;
  }

  function name() external pure override returns (string memory) {
    return "X-meme Tax";
  }

  function symbol() external pure override returns (string memory) {
    return "XMT";
  }

  function tokenURI(uint256 tokenId) external view override returns (string memory) {
    Info memory info = _getInfo(tokenId);

    string[3] memory parts;

    parts[
      0
    ] = '<svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="600" height="600" fill="#1E1E1E"/><rect width="600" height="600" fill="#1F1F1F"/><rect x="48" y="306" width="504" height="176" rx="16" fill="#292929"/><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="68" y="377.273">';
    parts[1] = info.tid;
    parts[
      2
    ] = '</tspan></text><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="81.7891" y="349.273"> ID</tspan></text><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="68" y="349.273">&#x1d54f;</tspan></text><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="68" y="425.273">1% Trade Fee Ownership Certificate NFT.  </tspan></text><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="68" y="453.273">Auto-transfer all fees to holder&#39;s wallet.</tspan></text><text fill="#DAFF7D" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="40" font-weight="500" letter-spacing="0em"><tspan x="48.4375" y="156.545">One</tspan></text><path d="M173.407 125.75H178.92L166.875 139.517L181.045 158.25H169.95L161.26 146.888L151.317 158.25H145.8L158.683 143.525L145.09 125.75H156.467L164.322 136.135L173.407 125.75ZM171.472 154.95H174.527L154.807 128.877H151.528L171.472 154.95Z" fill="#DAFF7D"/><text fill="#DAFF7D" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="40" font-weight="500" letter-spacing="0em"><tspan x="200.484" y="156.545">ID, One Memecoin</tspan></text><g clip-path="url(#clip0_4969_3729)"><path d="M138.366 199.375H143.328L132.488 211.765L145.241 228.625H135.255L127.434 218.4L118.485 228.625H113.52L125.115 215.372L112.881 199.375H123.12L130.19 208.721L138.366 199.375ZM136.625 225.655H139.374L121.626 202.189H118.676L136.625 225.655Z" fill="#9B9B9B"/></g><g clip-path="url(#clip1_4969_3729)"><path d="M478.366 197.375H483.328L472.488 209.765L485.241 226.625H475.255L467.434 216.4L458.485 226.625H453.52L465.115 213.372L452.881 197.375H463.12L470.19 206.721L478.366 197.375ZM476.625 223.655H479.374L461.626 200.189H458.676L476.625 223.655Z" fill="#9B9B9B"/></g><path d="M399 230H435V194H399V230Z" fill="url(#pattern0_4969_3729)"/><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="36" font-weight="500" letter-spacing="0em"><tspan x="143" y="225.091">-meme, meme</tspan></text><defs><pattern id="pattern0_4969_3729" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_4969_3729" transform="scale(0.015625)"/></pattern><clipPath id="clip0_4969_3729"><rect width="36" height="36" fill="white" transform="translate(111 196)"/></clipPath><clipPath id="clip1_4969_3729"><rect width="36" height="36" fill="white" transform="translate(451 194)"/></clipPath><image id="image0_4969_3729" width="64" height="64" xlink:href="data:image/png;base64,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"/></defs></svg>';

    return _pack(tokenId, parts);
  }

  function _getInfo(uint256 tokenId) private view returns (Info memory info) {
    (info.tid, , , ) = IFeeNFT(feeNFT).tokenIdToInfo(tokenId);
  }

  function _pack(uint256 tokenId, string[3] memory parts) private view returns (string memory output) {
    string memory partsOutput = string(abi.encodePacked(parts[0], parts[1], parts[2]));

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
    return string(abi.encodePacked("X ID: ", info.tid));
  }

  function _desc(uint256 tokenId) private view returns (string memory) {
    Info memory info = _getInfo(tokenId);
    return
      string(
        abi.encodePacked(
          "A tradable NFT that grants the holder 1% ownership of trade fees from X ID: ",
          info.tid,
          " as a certificate. X ID holder can claim this NFT anytime. If claimed, it directly transfers to the X ID holder's wallet; else as protocol fees."
        )
      );
  }
}
