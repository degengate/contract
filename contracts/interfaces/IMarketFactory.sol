// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IMarketFactory {
  event Create(uint256 appId, address market);

  function foundry() external view returns (address);

  function create(
    uint256 appId,
    uint256 feeDenominator,
    uint256 totalPercent,
    address curve,
    address payToken,
    uint256 buySellFee
  ) external returns (address addr);
}
