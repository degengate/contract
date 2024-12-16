import { ethers } from "hardhat";
import { expect } from "chai";

import {
  appid,
  foundryAddress,
  appName,
  cPFCurveFactoryAddress,
  appOwnerBuyFee,
  appOwnerSellFee,
  appOwnerMortgageFee,
  feeNFTBuyFee,
  feeNFTSellFee,
  mw_address,
  platformMortgageFee,
} from "./params.json";
import { ZeroAddress } from "ethers";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];

  let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256"],
    [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
  )

  const foundry = await ethers.getContractAt("Foundry", foundryAddress);

  const a = await foundry.createApp(appName, deployWallet.address, cPFCurveFactoryAddress, curveParams, ZeroAddress, {
    appOwnerBuyFee: appOwnerBuyFee,
    appOwnerSellFee: appOwnerSellFee,
    appOwnerMortgageFee: appOwnerMortgageFee,
    appOwnerFeeRecipient: mw_address,
    nftOwnerBuyFee: feeNFTBuyFee,
    nftOwnerSellFee: feeNFTSellFee,
  });
  const result = await a.wait();

  console.log(`foundry createApp at ${result?.hash}`);

  expect(await foundry.nextAppId()).eq(appid + 1)

  const appInfo = await foundry.apps(appid);
  expect(appInfo.name).eq(appName);
  expect(appInfo.operator).eq(ZeroAddress);
  expect(appInfo.owner).eq(deployWallet.address);
  expect(appInfo.payToken).eq(ZeroAddress);
  expect(appInfo.foundry).eq(foundryAddress);

  console.log("feeNFT", appInfo.feeNFT)
  console.log("mortgageNFT", appInfo.mortgageNFT)
  console.log("market", appInfo.market)
  console.log("curve", appInfo.curve)

  const feeNFT = await ethers.getContractAt("FeeNFT", appInfo.feeNFT);
  expect(await feeNFT.foundry()).eq(foundryAddress);
  expect(await feeNFT.appId()).eq(appid);

  const mortgageNFT = await ethers.getContractAt("MortgageNFT", appInfo.mortgageNFT);
  expect(await mortgageNFT.foundry()).eq(foundryAddress);
  expect(await mortgageNFT.appId()).eq(appid);
  expect(await mortgageNFT.market()).eq(appInfo.market);

  const market = await ethers.getContractAt("Market", appInfo.market);
  expect(await market.feeDenominator()).eq(await foundry.FEE_DENOMINATOR());
  expect(await market.totalPercent()).eq(await foundry.TOTAL_PERCENT());
  expect(await market.foundry()).eq(foundryAddress);
  expect(await market.appId()).eq(appid);
  expect(await market.payToken()).eq(ZeroAddress);
  expect(await market.feeNFT()).eq(appInfo.feeNFT);
  expect(await market.mortgageNFT()).eq(appInfo.mortgageNFT);

  let appFee = await market.appFee()
  expect(appFee.appOwnerBuyFee).eq(appOwnerBuyFee)
  expect(appFee.appOwnerSellFee).eq(appOwnerSellFee)
  expect(appFee.appOwnerMortgageFee).eq(appOwnerMortgageFee)
  expect(appFee.appOwnerFeeRecipient).eq(mw_address)
  expect(appFee.nftOwnerBuyFee).eq(feeNFTBuyFee)
  expect(appFee.nftOwnerSellFee).eq(feeNFTSellFee)
  expect(appFee.platformMortgageFee).eq(platformMortgageFee)
  expect(appFee.platformMortgageFeeRecipient).eq(mw_address)

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
