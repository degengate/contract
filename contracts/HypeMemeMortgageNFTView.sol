// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./utils/Base64.sol";

import "./interfaces/INFTView.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/IMortgageNFT.sol";

contract HypeMemeMortgageNFTView is INFTView, Ownable {
  struct Info {
    string tid;
    string name;
    string ticker;
    string image;
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

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "',
            _name(tokenId, info),
            '", "description": "',
            _desc(),
            '", "image": "',
            _image(tokenId, info),
            '", "metadata": ',
            _metadata(info),
            "}"
          )
        )
      )
    );
    return string(abi.encodePacked("data:application/json;base64,", json));
  }

  function setImageUrlPrefix(string memory _imageUrlPrefix) external onlyOwner {
    imageUrlPrefix = _imageUrlPrefix;
  }

  function _getShowAmount(uint256 amount) private pure returns (string memory) {
    uint256 _int = amount / (10 ** 18);
    return Strings.toString(_int);
  }

  function _getInfo(uint256 tokenId) private view returns (Info memory info) {
    (info.tid, info.amount) = IMortgageNFT(mortgageNFT).info(tokenId);
    bytes memory data = IFoundry(foundry).tokenData(appId, info.tid);
    (info.name, info.ticker, , info.image, , , , , ) = abi.decode(
      data,
      (string, string, string, string, string, string, string, string, uint256)
    );
  }

  function _name(uint256 tokenId, Info memory info) private pure returns (string memory) {
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

  function _image(uint256 tokenId, Info memory info) private view returns (string memory) {
    return
      string(
        abi.encodePacked(
          imageUrlPrefix,
          Strings.toString(tokenId),
          "?metadata=",
          Base64.encodeURL(bytes(_metadata(info)))
        )
      );
  }

  function _metadata(Info memory info) private pure returns (string memory) {
    return
      string(
        abi.encodePacked(
          '{"name": "',
          info.name,
          '", "ticker": "',
          info.ticker,
          '", "amount": ',
          _getShowAmount(info.amount),
          ', "image": "',
          info.image,
          '"}'
        )
      );
  }
}
