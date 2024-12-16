import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

import {
  appid,
  firstBuyFee,
  foundryAddress,
  feeNFTAddress,
  mortgageNFTAddress,
  marketAddress,
  mw_address,
  sig_address
} from "./params.json";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];

  const XMeme = await ethers.getContractFactory("XMeme");
  const xMeme = await upgrades.deployProxy(XMeme, [
    foundryAddress,
    appid,
    feeNFTAddress,
    mortgageNFTAddress,
    marketAddress,
    firstBuyFee,
    mw_address,
    sig_address
  ]);
  await xMeme.waitForDeployment();
  console.log("xMeme deployed to:", xMeme.target);

  console.log("check ...");

  const xMemeCon = await ethers.getContractAt("XMeme", xMeme.target);

  expect(await xMemeCon.appId()).eq(appid);
  expect(await xMemeCon.foundry()).eq(foundryAddress);
  expect(await xMemeCon.feeNFT()).eq(feeNFTAddress);
  expect(await xMemeCon.mortgageNFT()).eq(mortgageNFTAddress);
  expect(await xMemeCon.market()).eq(marketAddress);

  expect(await xMemeCon.firstBuyFee()).eq(firstBuyFee);
  expect(await xMemeCon.fundRecipient()).eq(mw_address);
  expect(await xMemeCon.signatureAddress()).eq(sig_address);
  expect(await xMemeCon.isSystemReady()).eq(false);
  expect(await xMemeCon.owner()).eq(deployWallet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
