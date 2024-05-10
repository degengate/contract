// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";

import "./interfaces/IMortgageNFT.sol";
import "./interfaces/INFTView.sol";
import "./interfaces/IFoundry.sol";

contract MortgageNFT is Ownable, IMortgageNFT, ERC721Enumerable {
  address public immutable override foundry;
  uint256 public immutable override appId;

  address public override market;

  address public override mortgageNFTView;

  uint256 private _nextTokenId = 1;

  // tokenId => info
  mapping(uint256 => IMortgageNFT.Info) public override info;

  constructor(address _foundry, uint256 _appId, address _owner, string memory _name) ERC721(_name, _name) {
    foundry = _foundry;
    appId = _appId;
    _transferOwnership(_owner);
  }

  function initialize(address _market) external override {
    require(msg.sender == foundry, "onlyFoundry");
    market = _market;

    emit Initialize(market);
  }

  modifier onlyMarket() {
    require(msg.sender == market, "onlyMarket");
    _;
  }

  function isApprovedOrOwner(address addr, uint256 tokenId) external view returns (bool) {
    return _isApprovedOrOwner(addr, tokenId);
  }

  function mint(address to, string memory tid, uint256 amount) external override onlyMarket returns (uint256 tokenId) {
    tokenId = _nextTokenId;
    _nextTokenId += 1;

    info[tokenId] = Info({tid: tid, amount: amount});
    _safeMint(to, tokenId);

    emit Mint(to, tid, amount);
  }

  function burn(uint256 tokenId) external override onlyMarket {
    _requireMinted(tokenId);

    _burn(tokenId);
    delete info[tokenId];

    emit Burn(tokenId);
  }

  function add(uint256 tokenId, uint256 amount) external override onlyMarket {
    _requireMinted(tokenId);

    info[tokenId].amount += amount;

    emit Add(tokenId, amount);
  }

  function remove(uint256 tokenId, uint256 amount) external override onlyMarket {
    _requireMinted(tokenId);
    require(info[tokenId].amount >= amount, "RAE");

    if (info[tokenId].amount == amount) {
      _burn(tokenId);
      delete info[tokenId];
    } else {
      info[tokenId].amount -= amount;
    }

    emit Remove(tokenId, amount);
  }

  function setMortgageNFTView(address newMortgageNFTView) external override onlyOwner {
    mortgageNFTView = newMortgageNFTView;

    emit SetMortgageNFTView(newMortgageNFTView, msg.sender);
  }

  function tokenInfosOfOwner(address _owner) external view override returns (IMortgageNFT.Info[] memory infos) {
    uint256 count = balanceOf(_owner);
    infos = new IMortgageNFT.Info[](count);
    for (uint256 index = 0; index < count; index++) {
      uint256 tokenId = tokenOfOwnerByIndex(_owner, index);
      infos[index] = info[tokenId];
    }
  }

  function tokenInfosOfOwnerByTid(
    address _owner,
    string memory tid
  ) external view override returns (IMortgageNFT.Info[] memory infos) {
    uint256 count = balanceOf(_owner);
    uint256 tidCount = 0;

    for (uint256 index = 0; index < count; index++) {
      uint256 tokenId = tokenOfOwnerByIndex(_owner, index);
      if (keccak256(abi.encodePacked(info[tokenId].tid)) == keccak256(abi.encodePacked(tid))) {
        tidCount += 1;
      }
    }

    if (tidCount != 0) {
      infos = new IMortgageNFT.Info[](tidCount);
      uint256 currentIndex = 0;
      for (uint256 index = 0; index < count; index++) {
        uint256 tokenId = tokenOfOwnerByIndex(_owner, index);
        if (keccak256(abi.encodePacked(info[tokenId].tid)) == keccak256(abi.encodePacked(tid))) {
          infos[currentIndex] = info[tokenId];
          currentIndex += 1;
        }
      }
    }
  }

  function name() public view override returns (string memory) {
    if (mortgageNFTView != address(0)) {
      return INFTView(mortgageNFTView).name();
    }
    return super.name();
  }

  function symbol() public view override returns (string memory) {
    if (mortgageNFTView != address(0)) {
      return INFTView(mortgageNFTView).symbol();
    }
    return super.symbol();
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory output) {
    if (mortgageNFTView != address(0)) {
      output = INFTView(mortgageNFTView).tokenURI(tokenId);
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
              "If you need to customize the display content, please use the setMortgageNFTView function in the contract to set a custom display contract.",
              '"}'
            )
          )
        )
      );
      output = string(abi.encodePacked("data:application/json;base64,", json));
    }
  }
}
