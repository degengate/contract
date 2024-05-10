// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "./PublicNFT.sol";
import "./interfaces/IPublicNFTFactory.sol";

contract PublicNFTFactory is IPublicNFTFactory {
  address public immutable override foundry;

  constructor(address _foundry) {
    foundry = _foundry;
  }

  function create(uint256 appId, string memory name, address owner) external override returns (address addr) {
    require(msg.sender == foundry, "onlyFoundry");

    addr = address(new PublicNFT(foundry, appId, owner, string(abi.encodePacked(name, " Tax"))));

    emit Create(appId, name, addr);
  }
}
