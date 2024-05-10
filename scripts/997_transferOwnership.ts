import { ethers } from "hardhat";
import { expect } from "chai";

import {
  appid,
  foundryAddress,
  degenGateOwnerWalletAddress,
  degenGateNFTClaimOwnerWalletAddress,
  degenGateAppOwnerWalletAddress,
  foundryOwnerWalletAddress,
  degenGatePublicNFTOwnerWalletAddress,
  degenGateMortgageNFTOwnerWalletAddress,
  degenGateAddress,
  degenGateNFTClaimAddress,
  degenGatePublicNFTAddress,
  degenGateMortgageNFTAddress,
} from "./params.json";
import config from "./config.json";

let first_add = 12;

async function main() {
  const foundry = await ethers.getContractAt("Foundry", foundryAddress);
  const degenGate = await ethers.getContractAt("DegenGate", degenGateAddress);
  const degenGateNFTClaim = await ethers.getContractAt("DegenGateNFTClaim", degenGateNFTClaimAddress);
  const publicNFT = await ethers.getContractAt("PublicNFT", degenGatePublicNFTAddress);
  const mortgageNFT = await ethers.getContractAt("MortgageNFT", degenGateMortgageNFTAddress);

  // foundry
  const a = await foundry.transferOwnership(foundryOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + first_add,
  });
  const result = await a.wait();
  console.log(`foundry transferOwnership to ${foundryOwnerWalletAddress} at ${result?.hash}`);

  // degenGate
  const b = await degenGate.transferOwnership(degenGateOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + first_add + 1,
  });
  const result2 = await b.wait();
  console.log(`degenGate transferOwnership to ${degenGateOwnerWalletAddress} at ${result2?.hash}`);

  // degenGateNFTClaim
  const c = await degenGateNFTClaim.transferOwnership(degenGateNFTClaimOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + first_add + 2,
  });
  const result3 = await c.wait();
  console.log(`degenGateNFTClaim transferOwnership to ${degenGateNFTClaimOwnerWalletAddress} at ${result3?.hash}`);

  // degenGate app owner
  const d = await foundry.setAppOwner(appid, degenGateAppOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + first_add + 3,
  });
  const result4 = await d.wait();
  console.log(`foundry setAppOwner to ${degenGateAppOwnerWalletAddress} at ${result4?.hash}`);

  // public nft owner
  const e = await publicNFT.transferOwnership(degenGatePublicNFTOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + first_add + 4,
  });
  const result5 = await e.wait();
  console.log(`publicNFT transferOwnership to ${degenGatePublicNFTOwnerWalletAddress} at ${result5?.hash}`);

  // mortgage nft owner
  const f = await mortgageNFT.transferOwnership(degenGateMortgageNFTOwnerWalletAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + first_add + 5,
  });
  const result6 = await f.wait();
  console.log(`mortgageNFT transferOwnership to ${degenGateMortgageNFTOwnerWalletAddress} at ${result6?.hash}`);

  // check
  expect(await foundry.owner()).eq(foundryOwnerWalletAddress);
  expect(await degenGate.owner()).eq(degenGateOwnerWalletAddress);
  expect(await degenGateNFTClaim.owner()).eq(degenGateNFTClaimOwnerWalletAddress);

  expect(await publicNFT.owner()).eq(degenGatePublicNFTOwnerWalletAddress);
  expect(await mortgageNFT.owner()).eq(degenGateMortgageNFTOwnerWalletAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
