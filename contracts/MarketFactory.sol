// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "./Market.sol";
import "./interfaces/IMarketFactory.sol";

contract MarketFactory is IMarketFactory {
  address public immutable override foundry;

  constructor(address _foundry) {
    foundry = _foundry;
  }

  function create(
    uint256 appId,
    uint256 feeDenominator,
    uint256 totalPercent,
    address curve,
    address payToken
  ) external override returns (address addr) {
    require(msg.sender == foundry, "onlyFoundry");

    addr = address(new Market(foundry, appId, feeDenominator, totalPercent, curve, payToken));

    emit Create(appId, addr);
  }
}
