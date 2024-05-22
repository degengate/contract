import { ethers } from "hardhat";
import { expect } from "chai";

import {
  appid,
  foundryAddress,
  degenGateNFTClaimAddress,
  degenGateMortgageNFTViewAddress,
  degenGateMortgageNFTAddress,
} from "./params.json";
import config from "./config.json";

async function main() {
  const mortgageNFTView = await ethers.deployContract(
    "MortgageNFTView",
    [foundryAddress, appid, degenGateMortgageNFTAddress, degenGateNFTClaimAddress],
    {
      maxFeePerGas: config.maxFeePerGas,
      maxPriorityFeePerGas: config.maxPriorityFeePerGas,
      nonce: config.nonce0 + 12,
    },
  );

  await mortgageNFTView.waitForDeployment();

  console.log(`mortgageNFTView deployed to ${mortgageNFTView.target}`);

  expect(degenGateMortgageNFTViewAddress).eq(mortgageNFTView.target);

  console.log("check ...");

  const mortgageNFTViewCon = await ethers.getContractAt("MortgageNFTView", degenGateMortgageNFTViewAddress);

  expect(await mortgageNFTViewCon.appId()).eq(appid);
  expect(await mortgageNFTViewCon.foundry()).eq(foundryAddress);
  expect(await mortgageNFTViewCon.mortgageNFT()).eq(degenGateMortgageNFTAddress);
  expect(await mortgageNFTViewCon.nftClaim()).eq(degenGateNFTClaimAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
