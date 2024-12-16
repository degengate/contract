// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

interface ICurveFactory {
  event Create(uint256 appId, bytes params);

  function foundry() external view returns (address);

  function create(uint256 appId, bytes memory params) external returns (address addr);
}
