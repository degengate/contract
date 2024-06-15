// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IPoint.sol";

contract Point is IPoint, ERC20 {
  address public immutable degenGate;
  address public immutable vault;
  uint256 public immutable MAX_TOKEN_SUPPLY = 36_965_935_954 * (10 ** decimals());

  event Mint(address account, uint256 amount);
  event BurnSender(address account, uint256 amount);
  event BurnOrigin(address account, uint256 amount);

  constructor(address _degenGate, address _vault) ERC20("Point", "POINT") {
    degenGate = _degenGate;
    vault = _vault;
  }

  function mint(address account, uint256 amount) external override {
    require(msg.sender == degenGate, "SE");
    require(totalSupply() + amount <= MAX_TOKEN_SUPPLY, "MTSE");

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
