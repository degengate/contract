import { ethers } from "hardhat";
import { expect } from "chai";

import {
  appid,
  foundryAddress,
} from "./hype_meme_params.json";

async function main() {
  let mw_address: string = process.env.MW_ADDRESS || "";
  if (mw_address.length === 0) {
    throw new Error("MW_ADDRESS is empty");
  }

  const foundry = await ethers.getContractAt("Foundry", foundryAddress);
  const info = await foundry.apps(appid);
  expect(info.owner).eq(mw_address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
