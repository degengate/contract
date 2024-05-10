import { ethers } from "hardhat";
import { expect } from "chai";

import { foundryAddress, marketFactoryAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const marketFactory = await ethers.deployContract("MarketFactory", [foundryAddress], {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 3,
  });

  await marketFactory.waitForDeployment();

  console.log(`MarketFactory deployed to ${marketFactory.target}`);

  expect(marketFactory.target).eq(marketFactoryAddress);

  console.log("check ...");

  const marketFactoryCon = await ethers.getContractAt("MarketFactory", marketFactoryAddress);

  expect(await marketFactoryCon.foundry()).eq(foundryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
