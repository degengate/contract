import { ethers } from "hardhat";
import { expect } from "chai";

import { appid, foundryAddress, degenGateNFTClaimAddress, degenGatePublicNFTViewAddress, degenGatePublicNFTAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const publicNFTView = await ethers.deployContract(
    "PublicNFTView",
    [foundryAddress, appid, degenGatePublicNFTAddress, degenGateNFTClaimAddress],
    {
      maxFeePerGas: config.maxFeePerGas,
      maxPriorityFeePerGas: config.maxPriorityFeePerGas,
      nonce: config.nonce0 + 11,
    },
  );

  await publicNFTView.waitForDeployment();

  console.log(`publicNFTView deployed to ${publicNFTView.target}`);

  expect(degenGatePublicNFTViewAddress).eq(publicNFTView.target);

  console.log("check ...");

  const publicNFTViewCon = await ethers.getContractAt("PublicNFTView", degenGatePublicNFTViewAddress);

  expect(await publicNFTViewCon.appId()).eq(appid);
  expect(await publicNFTViewCon.foundry()).eq(foundryAddress);
  expect(await publicNFTViewCon.publicNFT()).eq(degenGatePublicNFTAddress);
  expect(await publicNFTViewCon.nftClaim()).eq(degenGateNFTClaimAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
