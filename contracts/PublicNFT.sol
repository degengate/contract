// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";

import "./interfaces/IFoundry.sol";
import "./interfaces/IPublicNFT.sol";
import "./interfaces/INFTView.sol";

contract PublicNFT is Ownable, IPublicNFT, ERC721Enumerable {
  address public immutable override foundry;
  uint256 public immutable override appId;

  address public override publicNFTView;

  mapping(uint256 => IPublicNFT.Info) private _tokenIdToInfo;
  mapping(string => uint256[]) private _tidToTokenIds;

  uint256 private _nextTokenId = 1;

  constructor(address _foundry, uint256 _appId, address _owner, string memory _name) ERC721(_name, _name) {
    foundry = _foundry;
    appId = _appId;
    _transferOwnership(_owner);
  }

  modifier onlyFoundry() {
    require(msg.sender == foundry, "onlyFoundry");
    _;
  }

  function tokenIdToInfo(
    uint256 tokenId
  ) public view override returns (string memory tid, uint256 percent, bytes memory data, address _owner) {
    IPublicNFT.Info memory info = _tokenIdToInfo[tokenId];
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

  function setPublicNFTView(address newPublicNFTView) external override onlyOwner {
    publicNFTView = newPublicNFTView;

    emit SetPublicNFTView(newPublicNFTView, msg.sender);
  }

  function name() public view override returns (string memory) {
    if (publicNFTView != address(0)) {
      return INFTView(publicNFTView).name();
    }
    return super.name();
  }

  function symbol() public view override returns (string memory) {
    if (publicNFTView != address(0)) {
      return INFTView(publicNFTView).symbol();
    }
    return super.symbol();
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory output) {
    if (publicNFTView != address(0)) {
      output = INFTView(publicNFTView).tokenURI(tokenId);
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
              "If you need to customize the display content, please use the setPublicNFTView function in the contract to set a custom display contract.",
              '"}'
            )
          )
        )
      );
      output = string(abi.encodePacked("data:application/json;base64,", json));
    }
  }
}
