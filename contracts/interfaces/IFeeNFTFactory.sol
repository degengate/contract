// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

interface IFeeNFTFactory {
  event Create(uint256 appId, string name, address feeNFT);

  function foundry() external view returns (address);

  function create(uint256 appId, string memory name, address owner) external returns (address addr);
}
