import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";

import {
  PublicNFTFactory,
  MortgageNFTFactory,
  MarketFactory,
  Foundry,
  PublicNFT,
  MortgageNFT,
  Market,
  Curve,
  SimpleToken,
  AppOperator
} from "../../typechain-types";


async function getContractAddress(sender: string, nonce: number) {
  console.log("sender ", sender);
  console.log("nonce ", nonce);
  return ethers.getCreateAddress({
    from: sender,
    nonce: nonce,
  });
}

export type AllContractAddressInfo = {
  foundry: string;
  publicNFTFactory: string;
  mortgageNFTFactory: string;
  marketFactory: string;
  curve: string;
  simpleToken: string;
  appOperator: string
};

export async function getAllContractAddress(deployWallet: HardhatEthersSigner): Promise<AllContractAddressInfo> {
  const nextNoice = await deployWallet.getNonce();

  // deploy foundry 0
  // deploy publicNFTFactory 1
  // deploy mortgageNFTFactory 2
  // deploy marketFactory 3
  // deploy curve 4
  // deploy simpleToken 5
  // create app 6
  // deploy appOperator 7

  const foundry = await getContractAddress(deployWallet.address, nextNoice);
  const publicNFTFactory = await getContractAddress(deployWallet.address, nextNoice + 1);
  const mortgageNFTFactory = await getContractAddress(deployWallet.address, nextNoice + 2);
  const marketFactory = await getContractAddress(deployWallet.address, nextNoice + 3);
  const curve = await getContractAddress(deployWallet.address, nextNoice + 4);
  const simpleToken = await getContractAddress(deployWallet.address, nextNoice + 5);
  const appOperator = await getContractAddress(deployWallet.address, nextNoice + 7);

  return {
    foundry: foundry,
    publicNFTFactory: publicNFTFactory,
    mortgageNFTFactory: mortgageNFTFactory,
    marketFactory: marketFactory,
    curve: curve,
    simpleToken: simpleToken,
    appOperator: appOperator,
  };
}



export type AppOperatorAllContractInfo = {
  wallets: any;
  deployWalletIndex: number;
  deployWallet: HardhatEthersSigner;
  signatureWalletIndex: number;
  signatureWallet: HardhatEthersSigner;
  userWalletIndex: number;
  userWallet: HardhatEthersSigner;
  mortgageFeeWalletIndex: number;
  mortgageFeeWallet: HardhatEthersSigner;
  appOperatorOwnerWalletIndex: number;
  appOperatorOwnerWallet: HardhatEthersSigner;
  appOperatorFundRecipientWalletIndex: number;
  appOperatorFundRecipientWallet: HardhatEthersSigner;
  nextWalletIndex: number;
  mortgageFee: number;
  buyFee: number;
  sellFee: number;
  appId: number;
  appName: string;

  foundry: Foundry;
  publicNFTFactory: PublicNFTFactory;
  mortgageNFTFactory: MortgageNFTFactory;
  marketFactory: MarketFactory;
  curve: Curve;
  simpleToken: SimpleToken;

  publicNFT: PublicNFT;
  mortgageNFT: MortgageNFT;
  market: Market;

  appOperator: AppOperator;
};


export async function deployAppOperatorAllContract(_sellFee: number): Promise<AppOperatorAllContractInfo> {
  let wallets;
  let deployWalletIndex = 0;
  let deployWallet: HardhatEthersSigner;
  let signatureWalletIndex = 1;
  let signatureWallet: HardhatEthersSigner;
  let userWalletIndex = 2;
  let userWallet: HardhatEthersSigner;
  let mortgageFeeWalletIndex = 3;
  let mortgageFeeWallet: HardhatEthersSigner;
  let appOperatorOwnerWalletIndex = 4;
  let appOperatorOwnerWallet: HardhatEthersSigner;
  let appOperatorFundRecipientWalletIndex = 5;
  let appOperatorFundRecipientWallet: HardhatEthersSigner;
  let nextWalletIndex = 6;
  let mortgageFee = 100;
  let buyFee = 1000;
  let sellFee = _sellFee;
  let appId = 1;
  let appName = "appOperator";

  let foundry: Foundry;
  let publicNFTFactory: PublicNFTFactory;
  let mortgageNFTFactory: MortgageNFTFactory;
  let marketFactory: MarketFactory;
  let curve: Curve;
  let simpleToken: SimpleToken;

  let publicNFT: PublicNFT;
  let mortgageNFT: MortgageNFT;
  let market: Market;

  let appOperator: AppOperator;

  wallets = await ethers.getSigners();
  deployWallet = wallets[deployWalletIndex];
  signatureWallet = wallets[signatureWalletIndex];
  userWallet = wallets[userWalletIndex];
  mortgageFeeWallet = wallets[mortgageFeeWalletIndex];
  appOperatorOwnerWallet = wallets[appOperatorOwnerWalletIndex];
  appOperatorFundRecipientWallet = wallets[appOperatorFundRecipientWalletIndex];

  let addressInfo = await getAllContractAddress(deployWallet);
  // deploy foundry
  foundry = (await (
    await ethers.getContractFactory("Foundry")
  ).deploy(
    addressInfo.publicNFTFactory,
    addressInfo.mortgageNFTFactory,
    addressInfo.marketFactory,
    mortgageFee,
    mortgageFeeWallet.address,
  )) as Foundry;

  // deploy publicNFTFactory
  publicNFTFactory = (await (
    await ethers.getContractFactory("PublicNFTFactory")
  ).deploy(await foundry.getAddress())) as PublicNFTFactory;

  // deploy mortgageNFTFactory
  mortgageNFTFactory = (await (
    await ethers.getContractFactory("MortgageNFTFactory")
  ).deploy(await foundry.getAddress())) as MortgageNFTFactory;

  // deploy marketFactory
  marketFactory = (await (
    await ethers.getContractFactory("MarketFactory")
  ).deploy(await foundry.getAddress())) as MarketFactory;

  // deploy curve
  curve = (await (await ethers.getContractFactory("Curve")).deploy()) as Curve;

  // deploy begen
  simpleToken = (await (await ethers.getContractFactory("SimpleToken")).deploy(
    BigInt(10) ** BigInt(54)
  )) as SimpleToken;

  // create app
  await foundry.createApp(appName, appOperatorOwnerWallet.address, addressInfo.appOperator, await curve.getAddress(), await simpleToken.getAddress(), buyFee, sellFee);

  let info = await foundry.apps(appId);
  publicNFT = (await ethers.getContractAt("PublicNFT", info.publicNFT)) as PublicNFT;
  mortgageNFT = (await ethers.getContractAt("MortgageNFT", info.mortgageNFT)) as MortgageNFT;
  market = (await ethers.getContractAt("Market", info.market)) as Market;

  // deploy appOperator
  appOperator = (await (
    await ethers.getContractFactory("AppOperator")
  ).deploy(
    addressInfo.foundry,
    appId,
    await mortgageNFT.getAddress(),
    await market.getAddress()
  )) as AppOperator;

  expect(await foundry.getAddress()).eq(addressInfo.foundry);
  expect(await publicNFTFactory.getAddress()).eq(addressInfo.publicNFTFactory);
  expect(await mortgageNFTFactory.getAddress()).eq(addressInfo.mortgageNFTFactory);
  expect(await marketFactory.getAddress()).eq(addressInfo.marketFactory);
  expect(await curve.getAddress()).eq(addressInfo.curve);
  expect(await simpleToken.getAddress()).eq(addressInfo.simpleToken);
  expect(await appOperator.getAddress()).eq(addressInfo.appOperator);

  return {
    wallets,
    deployWalletIndex,
    deployWallet,
    signatureWalletIndex,
    signatureWallet,
    userWalletIndex,
    userWallet,
    mortgageFeeWalletIndex,
    mortgageFeeWallet,
    appOperatorOwnerWalletIndex,
    appOperatorOwnerWallet,
    appOperatorFundRecipientWalletIndex,
    appOperatorFundRecipientWallet,
    nextWalletIndex,
    mortgageFee,
    buyFee,
    sellFee,
    appId,
    appName,

    foundry,
    publicNFTFactory,
    mortgageNFTFactory,
    marketFactory,
    curve,
    simpleToken,
    publicNFT,
    mortgageNFT,
    market,
    appOperator,
  };
}
