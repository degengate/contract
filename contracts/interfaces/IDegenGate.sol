// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IDegenGate {
  function pointToDegen(uint256 amount) external;

  function degenToPoint(uint256 amount) external;

  function boxMintPoint(address account, uint256 amount) external;
}
