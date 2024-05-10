// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IBegen.sol";

contract Begen is IBegen, ERC20, Ownable {
  address public immutable degenGate;
  address public immutable vault;
  bool public override specialTransferFromIsClosed;

  event SpecialTransferFrom(address from, address to, uint256 amount, address sender);
  event CloseSpecialTransferFrom();

  constructor(address _degenGate, address _vault) Ownable() ERC20("begen", "Begen") {
    degenGate = _degenGate;
    vault = _vault;
    _mint(vault, 10 ** 28 * 2);
  }

  function specialTransferFrom(address from, address to, uint256 amount) external override returns (bool) {
    require(!specialTransferFromIsClosed, "CE");
    require(msg.sender == degenGate || msg.sender == vault, "SE");
    require(from != vault, "FE");

    _transfer(from, to, amount);

    emit SpecialTransferFrom(from, to, amount, msg.sender);
    return true;
  }

  function closeSpecialTransferFrom() external onlyOwner {
    specialTransferFromIsClosed = true;

    emit CloseSpecialTransferFrom();
  }
}
