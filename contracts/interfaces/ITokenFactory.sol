// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface ITokenFactory {
  event Create(uint256 appId, string tid, address token);

  function foundry() external view returns (address);

  function create(uint256 appId, string memory tid) external returns (address addr);
}
