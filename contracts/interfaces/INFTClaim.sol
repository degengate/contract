// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface INFTClaim {
  event SetClaim(string tid);

  function isClaim(string memory tid) external view returns (bool);

  function setClaim(string memory tid) external;
}
