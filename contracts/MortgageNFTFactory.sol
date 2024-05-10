// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "./MortgageNFT.sol";
import "./interfaces/IMortgageNFTFactory.sol";

contract MortgageNFTFactory is IMortgageNFTFactory {
  address public immutable override foundry;

  constructor(address _foundry) {
    foundry = _foundry;
  }

  function create(uint256 appId, string memory name, address owner) external override returns (address addr) {
    require(msg.sender == foundry, "onlyFoundry");

    addr = address(new MortgageNFT(foundry, appId, owner, string(abi.encodePacked(name, " Position"))));

    emit Create(appId, name, addr);
  }
}
