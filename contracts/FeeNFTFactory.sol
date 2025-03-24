// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "./FeeNFT.sol";
import "./interfaces/IFeeNFTFactory.sol";

contract FeeNFTFactory is IFeeNFTFactory {
  address public immutable override foundry;

  constructor(address _foundry) {
    foundry = _foundry;
  }

  function create(uint256 appId, string memory name, address owner) external override returns (address addr) {
    require(msg.sender == foundry, "onlyFoundry");

    addr = address(new FeeNFT(foundry, appId, owner, string(abi.encodePacked(name, " Tax"))));

    emit Create(appId, name, addr);
  }
}
