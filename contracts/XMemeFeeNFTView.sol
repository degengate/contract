// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "base64-sol/base64.sol";

import "./interfaces/INFTView.sol";
import "./interfaces/IFeeNFT.sol";

contract XMemeFeeNFTView is INFTView {
  struct Info {
    string tid;
  }

  address public immutable feeNFT;

  constructor(address _feeNFT) {
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
    ] = '<svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="600" fill="#1E1E1E"/><rect width="600" height="600" fill="#1F1F1F"/><rect x="48" y="288" width="504" height="176" rx="16" fill="#292929"/><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="72" y="359.273">';
    parts[1] = info.tid;
    parts[
      2
    ] = '</tspan></text><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="85.7891" y="331.273"> ID</tspan></text><text fill="#9B9B9B" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="72" y="331.273">&#x1d54f;</tspan></text><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="72" y="407.273">1% trade fee ownership certificate NFT.  </tspan></text><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="20" font-weight="500" letter-spacing="0em"><tspan x="72" y="435.273">Auto-transfer all fees to holder&#39;s wallet.</tspan></text><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="40" font-weight="500" letter-spacing="0em"><tspan x="35.9375" y="174.545">One</tspan></text><path d="M161.407 143.75H166.92L154.875 157.517L169.045 176.25H157.95L149.26 164.888L139.317 176.25H133.8L146.683 161.525L133.09 143.75H144.467L152.322 154.135L161.407 143.75ZM159.472 172.95H162.527L142.807 146.877H139.528L159.472 172.95Z" fill="white"/><text fill="white" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="40" font-weight="500" letter-spacing="0em"><tspan x="188.48" y="174.545">ID = One Memecoin</tspan></text></svg>';

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
