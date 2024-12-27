import { ethers } from "hardhat";
import { expect } from "chai";

import {
  feeNFTAddress,
} from "./params.json";

async function main() {
  const xMemeFeeNFTView = await ethers.deployContract(
    "XMemeFeeNFTView",
    [feeNFTAddress],
  );

  await xMemeFeeNFTView.waitForDeployment();

  console.log(`xMemeFeeNFTView deployed to ${xMemeFeeNFTView.target}`);

  console.log("check ...");

  const xMemeFeeNFTViewCon = await ethers.getContractAt("XMemeFeeNFTView", xMemeFeeNFTView.target);

  expect(await xMemeFeeNFTViewCon.feeNFT()).eq(feeNFTAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
