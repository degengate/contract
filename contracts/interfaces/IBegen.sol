// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IBegen {
  function mint(address account, uint256 amount) external;

  function burnSender(uint256 amount) external;

  function burnOrigin(uint256 amount) external;
}
