import { ethers } from "hardhat";
import { expect } from "chai";

import { degenGatePublicNFTViewBGAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const publicNFTViewBG = await ethers.deployContract(
    "PublicNFTViewBG",
    [],
    {
      maxFeePerGas: config.maxFeePerGas,
      maxPriorityFeePerGas: config.maxPriorityFeePerGas,
      nonce: config.nonce0 + 11,
    },
  );

  await publicNFTViewBG.waitForDeployment();

  console.log(`publicNFTViewBG deployed to ${publicNFTViewBG.target}`);

  expect(degenGatePublicNFTViewBGAddress).eq(publicNFTViewBG.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
