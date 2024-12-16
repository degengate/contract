import { ethers } from "hardhat";
import { expect } from "chai";

import {
  foundryDataAddress,
  platformMortgageFee,
  mw_address
} from "./params.json";


async function main() {
  const foundry = await ethers.deployContract(
    "Foundry",
    [
      foundryDataAddress,
      platformMortgageFee,
      mw_address
    ],
  );

  await foundry.waitForDeployment();

  console.log(`Foundry deployed to ${foundry.target}`);

  console.log("check ...");

  expect(await foundry.isInitialized()).eq(false);
  expect(await foundry.foundryData()).eq(foundryDataAddress);
  expect(await foundry.defaultMortgageFee()).eq(platformMortgageFee);
  expect(await foundry.defaultMortgageFeeRecipient()).eq(mw_address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

