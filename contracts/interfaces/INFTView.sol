// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface INFTView {
  function name() external view returns (string memory);

  function symbol() external view returns (string memory);

  function tokenURI(uint256 tokenId) external view returns (string memory);
}
