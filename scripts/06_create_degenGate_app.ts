import { ethers } from "hardhat";
import { expect } from "chai";

import {
  foundryAddress,
  degenGateAddress,
  buyFee,
  sellFee,
  pointAddress,
  curveAddress,
  appid,
  degenGatePublicNFTAddress,
  degenGateMortgageNFTAddress,
  degenGateMarketAddress,
} from "./params.json";
import config from "./config.json";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];

  const foundry = await ethers.getContractAt("Foundry", foundryAddress);
  const a = await foundry.createApp("degenGate", deployWallet.address, degenGateAddress, curveAddress, pointAddress, buyFee, sellFee, {
    maxFeePerGas: config.maxFeePerGas,
    maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    nonce: config.nonce0 + 6,
  });
  const result = await a.wait();

  console.log(`foundry createApp at ${result?.hash}`);

  const appInfo = await foundry.apps(appid);
  expect(appInfo.operator).eq(degenGateAddress);
  expect(appInfo.owner).eq(deployWallet.address);
  expect(appInfo.publicNFT).eq(degenGatePublicNFTAddress);
  expect(appInfo.mortgageNFT).eq(degenGateMortgageNFTAddress);
  expect(appInfo.market).eq(degenGateMarketAddress);

  const publicNFT = await ethers.getContractAt("PublicNFT", appInfo.publicNFT);
  expect(await publicNFT.foundry()).eq(foundryAddress);
  expect(await publicNFT.appId()).eq(appid);

  const mortgageNFT = await ethers.getContractAt("MortgageNFT", appInfo.mortgageNFT);
  expect(await mortgageNFT.foundry()).eq(foundryAddress);
  expect(await mortgageNFT.appId()).eq(appid);
  expect(await mortgageNFT.market()).eq(appInfo.market);

  const market = await ethers.getContractAt("Market", appInfo.market);
  expect(await market.feeDenominator()).eq(await foundry.FEE_DENOMINATOR());
  expect(await market.totalPercent()).eq(await foundry.TOTAL_PERCENT());
  expect(await market.foundry()).eq(foundryAddress);
  expect(await market.appId()).eq(appid);
  expect(await market.payToken()).eq(pointAddress);
  expect(await market.publicNFT()).eq(appInfo.publicNFT);
  expect(await market.mortgageNFT()).eq(appInfo.mortgageNFT);
  expect(await market.buyFee()).eq(buyFee);
  expect(await market.sellFee()).eq(sellFee);

  let curve = await market.curve();
  expect(curve).eq(curveAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
