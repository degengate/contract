// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";

import "./interfaces/IMortgageNFT.sol";
import "./interfaces/INFTView.sol";

contract MortgageNFT is IMortgageNFT, Ownable, ERC721Enumerable {
  address public immutable override foundry;
  uint256 public immutable override appId;

  address public override market;

  address public override mortgageNFTView;

  uint256 private _nextTokenId = 1;

  // tokenId => info
  mapping(uint256 => IMortgageNFT.Info) private _info;

  constructor(
    address _foundry,
    uint256 _appId,
    address _owner,
    string memory _name
  ) ERC721(_name, _name) Ownable(_owner) {
    foundry = _foundry;
    appId = _appId;
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

  function info(uint256 tokenId) external view override returns (string memory tid, uint256 amount) {
    IMortgageNFT.Info memory res = _info[tokenId];
    tid = res.tid;
    amount = res.amount;
  }

  function mint(address to, string memory tid, uint256 amount) external override onlyMarket returns (uint256 tokenId) {
    tokenId = _nextTokenId;
    _nextTokenId += 1;

    _info[tokenId] = Info({tid: tid, tokenId: tokenId, amount: amount});
    _safeMint(to, tokenId);

    emit Mint(to, tid, amount);
  }

  function burn(uint256 tokenId) external override onlyMarket {
    _requireOwned(tokenId);

    _burn(tokenId);
    delete _info[tokenId];

    emit Burn(tokenId);
  }

  function add(uint256 tokenId, uint256 amount) external override onlyMarket {
    _requireOwned(tokenId);

    _info[tokenId].amount += amount;

    emit Add(tokenId, amount);
  }

  function remove(uint256 tokenId, uint256 amount) external override onlyMarket {
    _requireOwned(tokenId);
    require(_info[tokenId].amount >= amount, "RAE");

    if (_info[tokenId].amount == amount) {
      _burn(tokenId);
      delete _info[tokenId];
    } else {
      _info[tokenId].amount -= amount;
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
      infos[index] = _info[tokenId];
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
      if (keccak256(abi.encodePacked(_info[tokenId].tid)) == keccak256(abi.encodePacked(tid))) {
        tidCount += 1;
      }
    }

    if (tidCount != 0) {
      infos = new IMortgageNFT.Info[](tidCount);
      uint256 currentIndex = 0;
      for (uint256 index = 0; index < count; index++) {
        uint256 tokenId = tokenOfOwnerByIndex(_owner, index);
        if (keccak256(abi.encodePacked(_info[tokenId].tid)) == keccak256(abi.encodePacked(tid))) {
          infos[currentIndex] = _info[tokenId];
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
