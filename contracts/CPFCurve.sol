// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "./interfaces/ICurve.sol";

contract CPFCurve is ICurve {
  uint256 public lpProduct;
  uint256 public lpRatio;

  constructor(uint256 _lpProduct, uint256 _lpRatio) {
    lpProduct = _lpProduct;
    lpRatio = _lpRatio;
  }

  function curveMath(uint256 base, uint256 add) external view override returns (uint256) {
    return _curveMath(base + add) - _curveMath(base);
  }

  function _curveMath(uint256 v) private view returns (uint256) {
    return (lpProduct * v) / (lpRatio - v);
  }
}
