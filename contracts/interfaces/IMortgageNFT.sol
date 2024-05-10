// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IMortgageNFT {
  struct Info {
    string tid;
    uint256 amount;
  }

  event Initialize(address market);

  event Mint(address to, string tid, uint256 amount);

  event Burn(uint256 tokenId);

  event Add(uint256 tokenId, uint256 amount);

  event Remove(uint256 tokenId, uint256 amount);

  event SetMortgageNFTView(address newMortgageNFTView, address sender);

  function foundry() external view returns (address);

  function appId() external view returns (uint256);

  function market() external view returns (address);

  function mortgageNFTView() external view returns (address);

  function info(uint256 tokenId) external view returns (string memory tid, uint256 amount);

  function initialize(address market) external;

  function isApprovedOrOwner(address addr, uint256 tokenId) external view returns (bool);

  function mint(address to, string memory tid, uint256 amount) external returns (uint256 tokenId);

  function burn(uint256 tokenId) external;

  function add(uint256 tokenId, uint256 amount) external;

  function remove(uint256 tokenId, uint256 amount) external;

  function setMortgageNFTView(address newMortgageNFTView) external;

  function tokenInfosOfOwner(address owner) external view returns (IMortgageNFT.Info[] memory infos);

  function tokenInfosOfOwnerByTid(
    address owner,
    string memory tid
  ) external view returns (IMortgageNFT.Info[] memory infos);
}
