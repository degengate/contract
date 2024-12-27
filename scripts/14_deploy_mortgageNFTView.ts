import { ethers } from "hardhat";
import { expect } from "chai";

import {
  mortgageNFTAddress
} from "./params.json";

async function main() {
  const xMemeMortgageNFTView = await ethers.deployContract(
    "XMemeMortgageNFTView",
    [mortgageNFTAddress],
  );

  await xMemeMortgageNFTView.waitForDeployment();

  console.log(`xMemeMortgageNFTView deployed to ${xMemeMortgageNFTView.target}`);

  console.log("check ...");

  const mortgageNFTViewCon = await ethers.getContractAt("XMemeMortgageNFTView", xMemeMortgageNFTView.target);

  expect(await mortgageNFTViewCon.mortgageNFT()).eq(mortgageNFTAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
