// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.20;

interface IPublicNFTVault {
  function recordReceiveBuySellFee(uint256 tokenId, uint256 amount) external returns (bool);
}
