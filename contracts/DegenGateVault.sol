// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IBegen.sol";

contract DegenGateVault is Ownable {
  address public immutable degenGate;
  address public immutable begen;
  address public immutable degen;

  event ApproveBegen(uint256 amount);
  event AddApproveDegen();
  event Collect(address user, uint256 amount, bytes data);
  event CollectAll(address user, uint256 amount, bytes data);

  constructor(address _degenGate, address _begen, address _degen) Ownable() {
    degenGate = _degenGate;
    begen = _begen;
    degen = _degen;
  }

  function collect(uint256 amount, bytes memory data) external {
    require(IERC20(begen).balanceOf(msg.sender) >= amount, "BE");
    _TFBegenFromSender(amount);
    _transferDegen(msg.sender, amount);

    emit Collect(msg.sender, amount, data);
  }

  function collectAll(bytes memory data) external {
    uint256 amount = IERC20(begen).balanceOf(msg.sender);
    _TFBegenFromSender(amount);
    _transferDegen(msg.sender, amount);

    emit CollectAll(msg.sender, amount, data);
  }

  function approveBegen(uint256 amount) external onlyOwner {
    IERC20(begen).approve(degenGate, amount);

    emit ApproveBegen(amount);
  }

  function addApproveDegen() external onlyOwner {
    IERC20(degen).approve(degenGate, type(uint256).max);

    emit AddApproveDegen();
  }

  function _TFBegenFromSender(uint256 value) private {
    if (IBegen(begen).specialTransferFromIsClosed()) {
      SafeERC20.safeTransferFrom(IERC20(begen), msg.sender, address(this), value);
    } else {
      IBegen(begen).specialTransferFrom(msg.sender, address(this), value);
    }
  }

  function _transferDegen(address to, uint256 value) private {
    SafeERC20.safeTransfer(IERC20(degen), to, value);
  }
}
