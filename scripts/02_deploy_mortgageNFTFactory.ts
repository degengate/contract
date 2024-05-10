import { ethers } from "hardhat";
import { expect } from "chai";

import { foundryAddress, mortgageNFTFactoryAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const mortgageNFTFactory = await ethers.deployContract("MortgageNFTFactory", [foundryAddress], {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 2,
  });

  await mortgageNFTFactory.waitForDeployment();

  console.log(`MortgageNFTFactory deployed to ${mortgageNFTFactory.target}`);

  expect(mortgageNFTFactory.target).eq(mortgageNFTFactoryAddress);

  console.log("check ...");

  const mortgageNFTFactoryCon = await ethers.getContractAt("MortgageNFTFactory", mortgageNFTFactoryAddress);

  expect(await mortgageNFTFactoryCon.foundry()).eq(foundryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
