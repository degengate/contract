// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "./Token.sol";
import "./interfaces/ITokenFactory.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/IFoundryData.sol";

contract TokenFactory is ITokenFactory {
  address public immutable override foundry;

  constructor(address _foundry) {
    foundry = _foundry;
  }

  function create(uint256 appId, string memory tid) external override returns (address addr) {
    require(msg.sender == foundry, "onlyFoundry");

    IFoundryData.App memory app = IFoundry(foundry).apps(appId);
    string memory name = string(abi.encodePacked(tid, "@", app.name));
    string memory symbol = name;
    addr = address(new Token(name, symbol, app.market, tid));

    emit Create(appId, tid, addr);
  }
}
