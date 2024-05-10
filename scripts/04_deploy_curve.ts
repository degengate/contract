import { ethers } from "hardhat";
import { expect } from "chai";

import { curveAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const curve = await ethers.deployContract("Curve", [], {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 4,
  });

  await curve.waitForDeployment();

  console.log(`Curve deployed to ${curve.target}`);

  expect(curve.target).eq(curveAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
