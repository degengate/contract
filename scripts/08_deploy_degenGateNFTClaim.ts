import { ethers } from "hardhat";
import { expect } from "chai";

import { appid, foundryAddress, signatureWalletAddress, degenGateNFTClaimAddress, degenGateAddress, degenGatePublicNFTAddress, begenAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];

  const foundry = await ethers.getContractAt("Foundry", foundryAddress);
  const info = await foundry.apps(appid);

  const degenGateNFTClaim = await ethers.deployContract(
    "DegenGateNFTClaim",
    [degenGateAddress, degenGatePublicNFTAddress, info.market, signatureWalletAddress],
    {
      maxFeePerGas: config.maxFeePerGas,
      maxPriorityFeePerGas: config.maxPriorityFeePerGas,
      nonce: config.nonce0 + 8,
    },
  );

  await degenGateNFTClaim.waitForDeployment();

  console.log(`DegenGateNFTClaim deployed to ${degenGateNFTClaim.target}`);

  expect(degenGateNFTClaimAddress).eq(degenGateNFTClaim.target);

  console.log("check ...");

  const degenGateNFTClaimCon = await ethers.getContractAt("DegenGateNFTClaim", degenGateNFTClaimAddress);

  expect(await degenGateNFTClaimCon.degenGate()).eq(degenGateAddress);
  expect(await degenGateNFTClaimCon.publicNFT()).eq(degenGatePublicNFTAddress);
  expect(await degenGateNFTClaimCon.signatureAddress()).eq(signatureWalletAddress);
  expect(await degenGateNFTClaimCon.owner()).eq(deployWallet.address);
  expect(await degenGateNFTClaimCon.begen()).eq(begenAddress);
  expect(await degenGateNFTClaimCon.market()).eq(info.market);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
