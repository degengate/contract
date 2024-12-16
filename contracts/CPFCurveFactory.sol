// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "./interfaces/ICurve.sol";
import "./interfaces/ICurveFactory.sol";

import "./CPFCurve.sol";

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
