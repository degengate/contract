// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IBegen.sol";

contract Begen is IBegen, ERC20 {
  address public immutable degenGate;
  address public immutable vault;

  event Mint(address account, uint256 amount);
  event BurnSender(address account, uint256 amount);
  event BurnOrigin(address account, uint256 amount);

  constructor(address _degenGate, address _vault) ERC20("begen", "Begen") {
    degenGate = _degenGate;
    vault = _vault;
  }

  function mint(address account, uint256 amount) external override {
    require(msg.sender == degenGate, "SE");

    _mint(account, amount);

    emit Mint(account, amount);
  }

  function burnSender(uint256 amount) external override {
    _burn(msg.sender, amount);

    emit BurnSender(msg.sender, amount);
  }

  function burnOrigin(uint256 amount) external override {
    _burn(tx.origin, amount);

    emit BurnOrigin(tx.origin, amount);
  }
}
