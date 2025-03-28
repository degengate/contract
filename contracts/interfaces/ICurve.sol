// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

interface ICurve {
  function curveMath(uint256 base, uint256 add) external view returns (uint256);
}
