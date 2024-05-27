import { ethers } from "hardhat";
import { expect } from "chai";

import { degenGateMortgageNFTViewAddress, degenGateMortgageNFTAddress } from "./params.json";
import config from "./config.json";

async function main() {
  const mortgageNFT = await ethers.getContractAt("MortgageNFT", degenGateMortgageNFTAddress);

  const a = await mortgageNFT.setMortgageNFTView(degenGateMortgageNFTViewAddress, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 15,
  });
  const result = await a.wait();

  console.log(`mortgageNFT setMortgageNFTView ${degenGateMortgageNFTViewAddress} at ${result?.hash}`);

  expect(await mortgageNFT.mortgageNFTView()).eq(degenGateMortgageNFTViewAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
