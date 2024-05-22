import { ethers } from "hardhat";
import { expect } from "chai";

import { degenGatePublicNFTViewAddress, degenGatePublicNFTAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const publicNFT = await ethers.getContractAt("PublicNFT", degenGatePublicNFTAddress);

  const a = await publicNFT.setPublicNFTView(degenGatePublicNFTViewAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 13,
  });
  const result = await a.wait();

  console.log(`publicNFT setPublicNFTView ${degenGatePublicNFTViewAddress} at ${result?.hash}`);

  expect(await publicNFT.publicNFTView()).eq(degenGatePublicNFTViewAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
