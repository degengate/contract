// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";

import "./interfaces/IFeeNFT.sol";
import "./interfaces/INFTView.sol";

contract FeeNFT is IFeeNFT, Ownable, ERC721Enumerable {
  address public immutable override foundry;
  uint256 public immutable override appId;

  address public override feeNFTView;

  mapping(uint256 => IFeeNFT.Info) private _tokenIdToInfo;
  mapping(string => uint256[]) private _tidToTokenIds;

  uint256 private _nextTokenId = 1;

  constructor(
    address _foundry,
    uint256 _appId,
    address _owner,
    string memory _name
  ) ERC721(_name, _name) Ownable(_owner) {
    foundry = _foundry;
    appId = _appId;
  }

  modifier onlyFoundry() {
    require(msg.sender == foundry, "onlyFoundry");
    _;
  }

  function tokenIdToInfo(
    uint256 tokenId
  ) public view override returns (string memory tid, uint256 percent, bytes memory data, address _owner) {
    IFeeNFT.Info memory info = _tokenIdToInfo[tokenId];
    tid = info.tid;
    percent = info.percent;
    data = info.data;
    _owner = ownerOf(tokenId);
  }

  function tidToTokenIds(string memory tid) public view override returns (uint256[] memory) {
    return _tidToTokenIds[tid];
  }

  function tidToInfos(
    string memory tid
  )
    external
    view
    override
    returns (uint256[] memory tokenIds, uint256[] memory percents, bytes[] memory data, address[] memory owners)
  {
    tokenIds = tidToTokenIds(tid);
    percents = new uint256[](tokenIds.length);
    data = new bytes[](tokenIds.length);
    owners = new address[](tokenIds.length);

    for (uint256 i = 0; i < tokenIds.length; i++) {
      (, percents[i], data[i], owners[i]) = tokenIdToInfo(tokenIds[i]);
    }
  }

  function mint(
    string memory tid,
    uint256[] memory percents,
    address[] memory owners,
    bytes[] memory data
  ) external override onlyFoundry returns (uint256[] memory tokenIds) {
    tokenIds = new uint256[](percents.length);

    for (uint256 i = 0; i < percents.length; i++) {
      uint256 tokenId = _nextTokenId;
      _nextTokenId += 1;

      tokenIds[i] = tokenId;

      _tokenIdToInfo[tokenId] = Info({tid: tid, percent: percents[i], data: data[i]});
      _tidToTokenIds[tid].push(tokenId);

      _safeMint(owners[i], tokenId);
    }

    emit Mint(tid, tokenIds, percents, owners, data);
  }

  function setFeeNFTView(address newFeeNFTView) external override onlyOwner {
    feeNFTView = newFeeNFTView;

    emit SetFeeNFTView(newFeeNFTView, msg.sender);
  }

  function name() public view override returns (string memory) {
    if (feeNFTView != address(0)) {
      return INFTView(feeNFTView).name();
    }
    return super.name();
  }

  function symbol() public view override returns (string memory) {
    if (feeNFTView != address(0)) {
      return INFTView(feeNFTView).symbol();
    }
    return super.symbol();
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory output) {
    if (feeNFTView != address(0)) {
      output = INFTView(feeNFTView).tokenURI(tokenId);
    } else {
      string memory json = Base64.encode(
        bytes(
          string(
            abi.encodePacked(
              '{"name": "',
              name(),
              " ",
              Strings.toString(tokenId),
              '", "description": "',
              "If you need to customize the display content, please use the setFeeNFTView function in the contract to set a custom display contract.",
              '"}'
            )
          )
        )
      );
      output = string(abi.encodePacked("data:application/json;base64,", json));
    }
  }
}
