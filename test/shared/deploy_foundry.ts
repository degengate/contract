import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";

import {
    FeeNFTFactory,
    MortgageNFTFactory,
    MarketFactory,
    Foundry,
    CPFCurveFactory,
    TokenFactory,
    FoundryData
} from "../../typechain-types";

export type CoreContractInfo = {
    wallets: any;
    deployWalletIndex: number;
    deployWallet: HardhatEthersSigner;
    defaultMortgageFeeWalletIndex: number;
    defaultMortgageFeeWallet: HardhatEthersSigner;
    nextWalletIndex: number;
    defaultMortgageFee: number;
    foundryData: FoundryData;
    foundry: Foundry;
    feeNFTFactory: FeeNFTFactory;
    mortgageNFTFactory: MortgageNFTFactory;
    marketFactory: MarketFactory;
    tokenFactory: TokenFactory;
    cpfCurveFactory: CPFCurveFactory;
};


export async function deployCoreContract(): Promise<CoreContractInfo> {
    let wallets = await ethers.getSigners();
    let deployWalletIndex = 0;
    let deployWallet = wallets[deployWalletIndex];
    let defaultMortgageFeeWalletIndex = 1;
    let defaultMortgageFeeWallet = wallets[defaultMortgageFeeWalletIndex];
    let nextWalletIndex = 2;
    let defaultMortgageFee = 100;
    let foundryData: FoundryData;
    let foundry: Foundry;
    let feeNFTFactory: FeeNFTFactory;
    let mortgageNFTFactory: MortgageNFTFactory;
    let marketFactory: MarketFactory;
    let tokenFactory: TokenFactory;
    let cpfCurveFactory: CPFCurveFactory;

    // deploy foundryData
    foundryData = (await (
        await ethers.getContractFactory("FoundryData")
    ).deploy()) as FoundryData;

    // deploy foundry
    foundry = (await (
        await ethers.getContractFactory("Foundry")
    ).deploy(
        await foundryData.getAddress(),
        defaultMortgageFee,
        await defaultMortgageFeeWallet.getAddress(),
    )) as Foundry;

    // deploy feeNFTFactory
    feeNFTFactory = (await (
        await ethers.getContractFactory("FeeNFTFactory")
    ).deploy(await foundry.getAddress())) as FeeNFTFactory;

    // deploy mortgageNFTFactory
    mortgageNFTFactory = (await (
        await ethers.getContractFactory("MortgageNFTFactory")
    ).deploy(await foundry.getAddress())) as MortgageNFTFactory;

    // deploy marketFactory
    marketFactory = (await (
        await ethers.getContractFactory("MarketFactory")
    ).deploy(await foundry.getAddress())) as MarketFactory;

    // deploy tokenFactory
    tokenFactory = (await (
        await ethers.getContractFactory("TokenFactory")
    ).deploy(await foundry.getAddress())) as TokenFactory;

    // deploy cpfCurveFactory
    cpfCurveFactory = (await (await ethers.getContractFactory("CPFCurveFactory")
    ).deploy(await foundry.getAddress())) as CPFCurveFactory;

    foundryData.updateFoundryWhitelist(await foundry.getAddress(), true);
    foundry.initialize(
        await feeNFTFactory.getAddress(),
        await mortgageNFTFactory.getAddress(),
        await marketFactory.getAddress(),
        await tokenFactory.getAddress()
    )
    await foundry.updateCurveFactoryWhitelist(await cpfCurveFactory.getAddress(), true);

    expect(await foundryData.foundryWhitelist(await foundry.getAddress())).eq(true);
    expect(await foundryData.owner()).eq(await deployWallet.getAddress());

    expect(await foundry.foundryData()).eq(await foundryData.getAddress())
    expect(await foundry.isInitialized()).eq(true)

    expect(await foundry.feeNFTFactory()).eq(await feeNFTFactory.getAddress())
    expect(await foundry.mortgageNFTFactory()).eq(await mortgageNFTFactory.getAddress())
    expect(await foundry.marketFactory()).eq(await marketFactory.getAddress())
    expect(await foundry.tokenFactory()).eq(await tokenFactory.getAddress())

    expect(await foundry.defaultMortgageFee()).eq(defaultMortgageFee)
    expect(await foundry.defaultMortgageFeeRecipient()).eq(await defaultMortgageFeeWallet.getAddress())

    expect(await foundry.curveFactoryWhitelist(await cpfCurveFactory.getAddress())).eq(true)

    expect(await feeNFTFactory.foundry()).eq(await foundry.getAddress())
    expect(await mortgageNFTFactory.foundry()).eq(await foundry.getAddress())
    expect(await marketFactory.foundry()).eq(await foundry.getAddress())
    expect(await tokenFactory.foundry()).eq(await foundry.getAddress())

    return {
        wallets,
        deployWalletIndex,
        deployWallet,
        defaultMortgageFeeWalletIndex,
        defaultMortgageFeeWallet,
        nextWalletIndex,
        defaultMortgageFee,
        foundryData,
        foundry,
        feeNFTFactory,
        mortgageNFTFactory,
        marketFactory,
        tokenFactory,
        cpfCurveFactory
    };
}
