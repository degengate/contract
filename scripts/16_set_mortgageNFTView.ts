import { ethers } from "hardhat";
import { expect } from "chai";

import { mortgageNFTAddress, mortgageNFTViewAddress } from "./params.json";

async function main() {
  const mortgageNFT = await ethers.getContractAt("MortgageNFT", mortgageNFTAddress);

  const a = await mortgageNFT.setMortgageNFTView(mortgageNFTViewAddress);
  const result = await a.wait();

  console.log(`mortgageNFT setMortgageNFTView ${mortgageNFTViewAddress} at ${result?.hash}`);

  expect(await mortgageNFT.mortgageNFTView()).eq(mortgageNFTViewAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
