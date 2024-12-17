// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface ICurveFactory {
  event Create(uint256 appId, bytes params);

  function foundry() external view returns (address);

  function create(uint256 appId, bytes memory params) external returns (address addr);
}
