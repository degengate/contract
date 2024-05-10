// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IBegen {
  function specialTransferFromIsClosed() external view returns (bool);

  function specialTransferFrom(address from, address to, uint256 amount) external returns (bool);
}
