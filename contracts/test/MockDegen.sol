// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockDegen is ERC20 {
  constructor(uint256 amount) ERC20("mock degen", "MDEGEN") {
    _mint(msg.sender, amount);
  }
}
