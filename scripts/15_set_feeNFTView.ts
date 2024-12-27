import { ethers } from "hardhat";
import { expect } from "chai";

import { feeNFTAddress, feeNFTViewAddress } from "./params.json";

async function main() {
  const feeNFT = await ethers.getContractAt("FeeNFT", feeNFTAddress);

  const a = await feeNFT.setFeeNFTView(feeNFTViewAddress);
  const result = await a.wait();

  console.log(`feeNFT setFeeNFTView ${feeNFTViewAddress} at ${result?.hash}`);

  expect(await feeNFT.feeNFTView()).eq(feeNFTViewAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
