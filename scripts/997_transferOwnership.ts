import { ethers } from "hardhat";
import { expect } from "chai";

import {
  appid,
  foundryDataAddress,
  foundryAddress,
  xMemeAddress,
  feeNFTAddress,
  mortgageNFTAddress,
  mw_address,
} from "./params.json";

async function main() {
  const foundryData = await ethers.getContractAt("FoundryData", foundryDataAddress);
  const foundry = await ethers.getContractAt("Foundry", foundryAddress);
  const xMeme = await ethers.getContractAt("XMeme", xMemeAddress);
  const feeNFT = await ethers.getContractAt("FeeNFT", feeNFTAddress);
  const mortgageNFT = await ethers.getContractAt("MortgageNFT", mortgageNFTAddress);

  // foundryData
  const fd = await foundryData.transferOwnership(mw_address);
  const result1 = await fd.wait();
  console.log(`foundryData transferOwnership to ${mw_address} at ${result1?.hash}`);

  // foundry
  const a = await foundry.transferOwnership(mw_address);
  const result2 = await a.wait();
  console.log(`foundry transferOwnership to ${mw_address} at ${result2?.hash}`);

  // xMeme
  const b = await xMeme.transferOwnership(mw_address);
  const result3 = await b.wait();
  console.log(`xMeme transferOwnership to ${mw_address} at ${result3?.hash}`);

  // degenGate app owner
  const d = await foundry.setAppOwner(appid, mw_address);
  const result4 = await d.wait();
  console.log(`foundry setAppOwner to ${mw_address} at ${result4?.hash}`);

  // fee nft owner
  const e = await feeNFT.transferOwnership(mw_address);
  const result5 = await e.wait();
  console.log(`publicNFT transferOwnership to ${mw_address} at ${result5?.hash}`);

  // mortgage nft owner
  const f = await mortgageNFT.transferOwnership(mw_address);
  const result6 = await f.wait();
  console.log(`mortgageNFT transferOwnership to ${mw_address} at ${result6?.hash}`);

  // check
  expect(await foundry.owner()).eq(mw_address);
  expect(await xMeme.owner()).eq(mw_address);

  expect(await feeNFT.owner()).eq(mw_address);
  expect(await mortgageNFT.owner()).eq(mw_address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
