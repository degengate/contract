// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IFoundryData.sol";

contract FoundryData is IFoundryData, Ownable {
  uint256 public override nextAppId = 1;
  // appId => app
  mapping(uint256 => IFoundryData.App) private _apps;
  // appId => appFee
  mapping(uint256 => IFoundryData.AppFee) private _appFees;

  mapping(address => bool) public override foundryWhitelist;

  modifier appExistModifier(uint256 appId) {
    require(appExist(appId), "AE");
    _;
  }

  constructor() Ownable(msg.sender) {}

  function appExist(uint256 appId) public view override returns (bool) {
    return appId >= 1 && appId < nextAppId;
  }

  function apps(uint256 appId) external view override returns (IFoundryData.App memory app) {
    return _apps[appId];
  }

  function appFees(uint256 appId) external view override returns (IFoundryData.AppFee memory appFee) {
    return _appFees[appId];
  }

  function createApp(App memory app, AppFee memory appFee) external override returns (uint256 appId) {
    require(foundryWhitelist[msg.sender], "FWE");
    require(app.foundry == msg.sender, "FE");

    appId = nextAppId;
    nextAppId += 1;

    _apps[appId] = app;
    _appFees[appId] = appFee;

    emit CreateApp(appId, app, appFee, msg.sender);
  }

  function setAppOperator(uint256 appId, address operator) external override appExistModifier(appId) {
    require(msg.sender == _apps[appId].foundry, "FE");

    _apps[appId].operator = operator;

    emit SetAppOperator(appId, operator, msg.sender);
  }

  function setAppOwner(uint256 appId, address newOwner) external override appExistModifier(appId) {
    require(msg.sender == _apps[appId].foundry, "FE");

    _apps[appId].owner = newOwner;

    emit SetAppOwner(appId, newOwner, msg.sender);
  }

  function updateAppFee(uint256 appId, AppFee memory appFee) external override appExistModifier(appId) {
    require(msg.sender == _apps[appId].foundry, "FE");

    _appFees[appId] = appFee;

    emit UpdateAppFee(appId, appFee, msg.sender);
  }

  function updateFoundryWhitelist(address foundry, bool enabled) external override onlyOwner {
    foundryWhitelist[foundry] = enabled;

    emit UpdateFoundryWhitelist(foundry, enabled, msg.sender);
  }
}
