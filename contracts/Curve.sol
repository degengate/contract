// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "./interfaces/ICurve.sol";

contract Curve is ICurve {
  uint256 public constant X25 = 10000000000000000000000000;

  function curveMath(uint256 base, uint256 add) external pure returns (uint256) {
    return _curveMath(base + add) - _curveMath(base);
  }

  function _curveMath(uint256 v) private pure returns (uint256) {
    return (X25 * v) / (X25 - v);
  }
}
