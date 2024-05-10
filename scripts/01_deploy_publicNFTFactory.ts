import { ethers } from "hardhat";
import { expect } from "chai";

import { foundryAddress, publicNFTFactoryAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const publicNFTFactory = await ethers.deployContract("PublicNFTFactory", [foundryAddress], {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 1,
  });

  await publicNFTFactory.waitForDeployment();

  console.log(`PublicNFTFactory deployed to ${publicNFTFactory.target}`);

  expect(publicNFTFactory.target).eq(publicNFTFactoryAddress);

  console.log("check ...");

  const publicNFTFactoryCon = await ethers.getContractAt("PublicNFTFactory", publicNFTFactoryAddress);

  expect(await publicNFTFactoryCon.foundry()).eq(foundryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
