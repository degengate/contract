// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "./CPFCurve.sol";
import "./interfaces/ICurveFactory.sol";

contract CPFCurveFactory is ICurveFactory {
  address public immutable override foundry;

  constructor(address _foundry) {
    foundry = _foundry;
  }

  function create(uint256 appId, bytes memory params) external override returns (address addr) {
    require(msg.sender == foundry, "onlyFoundry");

    (uint256 lpProduct, uint256 lpRatio) = abi.decode(params, (uint256, uint256));
    addr = address(new CPFCurve(lpProduct, lpRatio));

    emit Create(appId, params);
  }
}
