import { ethers } from "hardhat";
import { expect } from "chai";

import {
  degenAddress,
  appid,
  foundryAddress,
  degenGateNFTClaimAddress,
  degenGateFundRecipientWalletAddress,
  signatureWalletAddress,
  degenGateAddress,
  degenGateVaultAddress,
  degenGateMortgageNFTAddress,
  degenGateMarketAddress,
  begenAddress,
} from "./params.json";
import config from "./config.json";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];

  const degenGate = await ethers.deployContract(
    "DegenGate",
    [
      foundryAddress,
      appid,
      degenGateMortgageNFTAddress,
      degenGateMarketAddress,
      degenAddress,
      degenGateVaultAddress,
      degenGateNFTClaimAddress,
      degenGateFundRecipientWalletAddress,
      signatureWalletAddress,
    ],
    {
      maxFeePerGas: config.maxFeePerGas,
      maxPriorityFeePerGas: config.maxPriorityFeePerGas,
      nonce: config.nonce0 + 7,
    },
  );

  await degenGate.waitForDeployment();

  console.log(`degenGate deployed to ${degenGate.target}`);

  expect(degenGate.target).eq(degenGateAddress);

  console.log("check ...");

  const degenGateCon = await ethers.getContractAt("DegenGate", degenGateAddress);

  expect(await degenGateCon.appId()).eq(appid);
  expect(await degenGateCon.foundry()).eq(foundryAddress);
  expect(await degenGateCon.market()).eq(degenGateMarketAddress);
  expect(await degenGateCon.mortgageNFT()).eq(degenGateMortgageNFTAddress);
  expect(await degenGateCon.nftClaim()).eq(degenGateNFTClaimAddress);
  expect(await degenGateCon.fundRecipient()).eq(degenGateFundRecipientWalletAddress);
  expect(await degenGateCon.signatureAddress()).eq(signatureWalletAddress);
  expect(await degenGateCon.begen()).eq(begenAddress);

  expect(await degenGateCon.owner()).eq(deployWallet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
