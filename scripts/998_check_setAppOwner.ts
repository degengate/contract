import { ethers } from "hardhat";
import { expect } from "chai";

import { foundryAddress, appid, degenGateAppOwnerWalletAddress } from "./params.json";

async function main() {
  const foundry = await ethers.getContractAt("Foundry", foundryAddress);
  const info = await foundry.apps(appid);
  expect(info.owner).eq(degenGateAppOwnerWalletAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
