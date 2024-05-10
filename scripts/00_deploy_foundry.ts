import { ethers } from "hardhat";
import { expect } from "chai";

import {
  publicNFTFactoryAddress,
  mortgageNFTFactoryAddress,
  marketFactoryAddress,
  mortgageFee,
  mortgageFeeWalletAddress,
  foundryAddress,
} from "./params.json";

import config from "./config.json";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];

  const foundry = await ethers.deployContract(
    "Foundry",
    [publicNFTFactoryAddress, mortgageNFTFactoryAddress, marketFactoryAddress, mortgageFee, mortgageFeeWalletAddress],
    {
      maxFeePerGas: config.maxFeePerGas,
      maxPriorityFeePerGas: config.maxPriorityFeePerGas,
      nonce: config.nonce0,
    },
  );

  await foundry.waitForDeployment();

  console.log(`Foundry deployed to ${foundry.target}`);

  expect(foundry.target).eq(foundryAddress);

  console.log("check ...");

  const foundryCon = await ethers.getContractAt("Foundry", foundryAddress);

  expect(await foundryCon.publicNFTFactory()).eq(publicNFTFactoryAddress);
  expect(await foundryCon.mortgageNFTFactory()).eq(mortgageNFTFactoryAddress);
  expect(await foundryCon.marketFactory()).eq(marketFactoryAddress);
  expect(await foundryCon.defaultMortgageFee()).eq(mortgageFee);
  expect(await foundryCon.defaultMortgageFeeRecipient()).eq(mortgageFeeWalletAddress);

  expect(await foundryCon.owner()).eq(deployWallet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
