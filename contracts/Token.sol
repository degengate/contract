// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IToken.sol";

contract Token is IToken, ERC20 {
  address public immutable override market;
  string public override tid;

  constructor(string memory _name, string memory _symbol, address _market, string memory _tid) ERC20(_name, _symbol) {
    market = _market;
    tid = _tid;
  }

  function marketMint(uint256 amount) external override {
    require(msg.sender == market, "TSE");

    _mint(msg.sender, amount);

    emit MarketMint(amount);
  }

  function marketBurn(uint256 amount) external override {
    require(msg.sender == market, "TSE");

    _burn(msg.sender, amount);

    emit MarketBurn(amount);
  }
}
