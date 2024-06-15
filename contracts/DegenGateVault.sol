// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IPoint.sol";

contract DegenGateVault is Ownable {
  address public immutable degenGate;
  address public immutable point;
  address public immutable degen;

  event AddApproveDegen();
  event Collect(address user, uint256 amount, bytes data);
  event CollectAll(address user, uint256 amount, bytes data);

  constructor(address _degenGate, address _point, address _degen) Ownable(msg.sender) {
    degenGate = _degenGate;
    point = _point;
    degen = _degen;
  }

  function collect(uint256 amount, bytes memory data) external {
    require(IERC20(point).balanceOf(tx.origin) >= amount, "BE");

    IPoint(point).burnOrigin(amount);
    _transferDegen(tx.origin, amount);

    emit Collect(tx.origin, amount, data);
  }

  function collectAll(bytes memory data) external {
    uint256 amount = IERC20(point).balanceOf(tx.origin);
    require(amount > 0, "BE");

    IPoint(point).burnOrigin(amount);
    _transferDegen(tx.origin, amount);

    emit CollectAll(tx.origin, amount, data);
  }

  function addApproveDegen() external onlyOwner {
    IERC20(degen).approve(degenGate, type(uint256).max);

    emit AddApproveDegen();
  }

  function _transferDegen(address to, uint256 value) private {
    SafeERC20.safeTransfer(IERC20(degen), to, value);
  }
}
