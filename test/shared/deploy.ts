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
  DegenGate,
  MockDegen,
  DegenGateNFTClaim,
  Begen,
  DegenGateVault
} from "../../typechain-types";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1);

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
  begen: string;
  degenGate: string;
  degenGateNFTClaim: string;
  degenGateVault: string;
};

export async function getAllContractAddress(deployWallet: HardhatEthersSigner): Promise<AllContractAddressInfo> {
  const nextNoice = await deployWallet.getNonce();

  // deploy foundry 0
  // deploy publicNFTFactory 1
  // deploy mortgageNFTFactory 2
  // deploy marketFactory 3
  // deploy curve 4
  // deploy begen 5
  // create degenGate app 6
  // deploy degenGate 7
  // deploy degenGateNFTClaim 8
  // deploy degenGateVault 9 

  const foundry = await getContractAddress(deployWallet.address, nextNoice);
  const publicNFTFactory = await getContractAddress(deployWallet.address, nextNoice + 1);
  const mortgageNFTFactory = await getContractAddress(deployWallet.address, nextNoice + 2);
  const marketFactory = await getContractAddress(deployWallet.address, nextNoice + 3);
  const curve = await getContractAddress(deployWallet.address, nextNoice + 4);
  const begen = await getContractAddress(deployWallet.address, nextNoice + 5);
  const degenGate = await getContractAddress(deployWallet.address, nextNoice + 7);
  const degenGateNFTClaim = await getContractAddress(deployWallet.address, nextNoice + 8);
  const degenGateVault = await getContractAddress(deployWallet.address, nextNoice + 9);

  return {
    foundry: foundry,
    publicNFTFactory: publicNFTFactory,
    mortgageNFTFactory: mortgageNFTFactory,
    marketFactory: marketFactory,
    curve: curve,
    begen: begen,
    degenGate: degenGate,
    degenGateNFTClaim: degenGateNFTClaim,
    degenGateVault: degenGateVault,
  };
}



export type AllContractInfo = {
  wallets: any;
  deployWalletIndex: number;
  deployWallet: HardhatEthersSigner;
  signatureWalletIndex: number;
  signatureWallet: HardhatEthersSigner;
  userWalletIndex: number;
  userWallet: HardhatEthersSigner;
  mortgageFeeWalletIndex: number;
  mortgageFeeWallet: HardhatEthersSigner;
  degenGateOwnerWalletIndex: number;
  degenGateOwnerWallet: HardhatEthersSigner;
  degenGateFundRecipientWalletIndex: number;
  degenGateFundRecipientWallet: HardhatEthersSigner;
  nextWalletIndex: number;
  mortgageFee: number;
  buySellFee: number;
  appId: number;
  appName: string;

  mockDegen: MockDegen;
  foundry: Foundry;
  publicNFTFactory: PublicNFTFactory;
  mortgageNFTFactory: MortgageNFTFactory;
  marketFactory: MarketFactory;
  curve: Curve;
  begen: Begen;

  publicNFT: PublicNFT;
  mortgageNFT: MortgageNFT;
  market: Market;

  degenGate: DegenGate;
  degenGateNFTClaim: DegenGateNFTClaim;
  degenGateVault: DegenGateVault;
};


export async function deployAllContract(): Promise<AllContractInfo> {
  let wallets;
  let deployWalletIndex = 0;
  let deployWallet: HardhatEthersSigner;
  let signatureWalletIndex = 1;
  let signatureWallet: HardhatEthersSigner;
  let userWalletIndex = 2;
  let userWallet: HardhatEthersSigner;
  let mortgageFeeWalletIndex = 3;
  let mortgageFeeWallet: HardhatEthersSigner;
  let degenGateOwnerWalletIndex = 4;
  let degenGateOwnerWallet: HardhatEthersSigner;
  let degenGateFundRecipientWalletIndex = 5;
  let degenGateFundRecipientWallet: HardhatEthersSigner;
  let nextWalletIndex = 6;
  let mortgageFee = 100;
  let buySellFee = 1000;
  let appId = 1;
  let appName = "degenGate";

  let mockDegen: MockDegen;
  let foundry: Foundry;
  let publicNFTFactory: PublicNFTFactory;
  let mortgageNFTFactory: MortgageNFTFactory;
  let marketFactory: MarketFactory;
  let curve: Curve;
  let begen: Begen;

  let publicNFT: PublicNFT;
  let mortgageNFT: MortgageNFT;
  let market: Market;

  let degenGate: DegenGate;
  let degenGateNFTClaim: DegenGateNFTClaim;
  let degenGateVault: DegenGateVault;

  wallets = await ethers.getSigners();
  deployWallet = wallets[deployWalletIndex];
  signatureWallet = wallets[signatureWalletIndex];
  userWallet = wallets[userWalletIndex];
  mortgageFeeWallet = wallets[mortgageFeeWalletIndex];
  degenGateOwnerWallet = wallets[degenGateOwnerWalletIndex];
  degenGateFundRecipientWallet = wallets[degenGateFundRecipientWalletIndex];

  // deploy MockDegen
  mockDegen = (await (
    await ethers.getContractFactory("MockDegen")
  ).deploy(
    BigInt(10) ** BigInt(29)
  )) as MockDegen;

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
  begen = (await (await ethers.getContractFactory("Begen")).deploy(
    addressInfo.degenGate, addressInfo.degenGateVault
  )) as Begen;

  // create degenGate app
  await foundry.createApp("degenGate", degenGateOwnerWallet.address, addressInfo.degenGate, await curve.getAddress(), await begen.getAddress(), buySellFee);

  let info = await foundry.apps(appId);
  publicNFT = (await ethers.getContractAt("PublicNFT", info.publicNFT)) as PublicNFT;
  mortgageNFT = (await ethers.getContractAt("MortgageNFT", info.mortgageNFT)) as MortgageNFT;
  market = (await ethers.getContractAt("Market", info.market)) as Market;

  // deploy degenGate
  degenGate = (await (
    await ethers.getContractFactory("DegenGate")
  ).deploy(
    addressInfo.foundry,
    appId,
    await mortgageNFT.getAddress(),
    await market.getAddress(),
    await mockDegen.getAddress(),
    addressInfo.degenGateVault,
    addressInfo.degenGateNFTClaim,
    degenGateFundRecipientWallet.address,
    signatureWallet.address,
  )) as DegenGate;

  // deploy degenGateNFTClaim
  degenGateNFTClaim = (await (
    await ethers.getContractFactory("DegenGateNFTClaim")
  ).deploy(await degenGate.getAddress(), info.publicNFT, info.market, signatureWallet.address)) as DegenGateNFTClaim;

  // deploy degenGateVault
  degenGateVault = (await (
    await ethers.getContractFactory("DegenGateVault")
  ).deploy(
    await degenGate.getAddress(),
    await begen.getAddress(),
    await mockDegen.getAddress()
  )) as DegenGateVault;

  expect(await foundry.getAddress()).eq(addressInfo.foundry);
  expect(await publicNFTFactory.getAddress()).eq(addressInfo.publicNFTFactory);
  expect(await mortgageNFTFactory.getAddress()).eq(addressInfo.mortgageNFTFactory);
  expect(await marketFactory.getAddress()).eq(addressInfo.marketFactory);
  expect(await curve.getAddress()).eq(addressInfo.curve);
  expect(await begen.getAddress()).eq(addressInfo.begen);
  expect(await degenGate.getAddress()).eq(addressInfo.degenGate);
  expect(await degenGateNFTClaim.getAddress()).eq(addressInfo.degenGateNFTClaim);
  expect(await degenGateVault.getAddress()).eq(addressInfo.degenGateVault);

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
    degenGateOwnerWalletIndex,
    degenGateOwnerWallet,
    degenGateFundRecipientWalletIndex,
    degenGateFundRecipientWallet,
    nextWalletIndex,
    mortgageFee,
    buySellFee,
    appId,
    appName,

    mockDegen,
    foundry,
    publicNFTFactory,
    mortgageNFTFactory,
    marketFactory,
    curve,
    begen,
    publicNFT,
    mortgageNFT,
    market,
    degenGate,
    degenGateNFTClaim,
    degenGateVault,
  };
}
