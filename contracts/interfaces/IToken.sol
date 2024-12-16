// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IToken {
  event MarketMint(uint256 amount);
  event MarketBurn(uint256 amount);

  function market() external view returns (address);

  function tid() external view returns (string memory);

  function marketMint(uint256 amount) external;

  function marketBurn(uint256 amount) external;
}
