// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IFeeNFT {
  struct Info {
    string tid;
    uint256 percent;
    bytes data;
  }

  event Mint(string tid, uint256[] tokenIds, uint256[] percents, address[] owners, bytes[] data);

  event SetFeeNFTView(address newFeeNFTView, address sender);

  function foundry() external view returns (address);

  function appId() external view returns (uint256);

  function feeNFTView() external view returns (address);

  function tokenIdToInfo(
    uint256 tokenId
  ) external view returns (string memory tid, uint256 percent, bytes memory data, address owner);

  function tidToTokenIds(string memory tid) external view returns (uint256[] memory);

  function tidToInfos(
    string memory tid
  )
    external
    view
    returns (uint256[] memory tokenIds, uint256[] memory percents, bytes[] memory data, address[] memory owners);

  function mint(
    string memory tid,
    uint256[] memory percents,
    address[] memory owners,
    bytes[] memory data
  ) external returns (uint256[] memory tokenIds);

  function setFeeNFTView(address newFeeNFTView) external;
}
