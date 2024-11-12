import { ethers, upgrades } from "hardhat";
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
    HypeMemeCurve,
    MockDegen,
    Point,
    HypeMeme
} from "../../typechain-types";
import { DegenGateAllContractInfo } from "./deploy_degen_gate";


async function getContractAddress(sender: string, nonce: number) {
    console.log("sender ", sender);
    console.log("nonce ", nonce);
    return ethers.getCreateAddress({
        from: sender,
        nonce: nonce,
    });
}

export type AllContractAddressInfo = {
    hypeMeme: string;
};

export async function getAllContractAddress(deployWallet: HardhatEthersSigner): Promise<AllContractAddressInfo> {
    const nextNoice = await deployWallet.getNonce();
    console.log("nextNoice", nextNoice)
    // create hype meme app 0
    // deploy hype meme 2
    const hypeMeme = await getContractAddress(deployWallet.address, nextNoice + 2);

    return {
        hypeMeme: hypeMeme,
    };
}



export type HypeMemeAllContractInfo = {
    wallets: any;
    deployWalletIndex: number;
    deployWallet: HardhatEthersSigner;
    signatureWalletIndex: number;
    signatureWallet: HardhatEthersSigner;
    userWalletIndex: number;
    userWallet: HardhatEthersSigner;
    mortgageFeeWalletIndex: number;
    mortgageFeeWallet: HardhatEthersSigner;

    hypeMemeOwnerWalletIndex: number;
    hypeMemeOwnerWallet: HardhatEthersSigner;
    hypeMemeFundRecipientWalletIndex: number;
    hypeMemeFundRecipientWallet: HardhatEthersSigner;

    nextWalletIndex: number;
    mortgageFee: number;

    hypeMemeBuyFee: number;
    hypeMemeSellFee: number;
    hypeMemeAppId: number;
    hypeMemeAppName: string;

    mockDegen: MockDegen;
    foundry: Foundry;
    publicNFTFactory: PublicNFTFactory;
    mortgageNFTFactory: MortgageNFTFactory;
    marketFactory: MarketFactory;
    hypeMemeCurve: HypeMemeCurve;
    point: Point;

    hypeMemePublicNFT: PublicNFT;
    hypeMemeMortgageNFT: MortgageNFT;
    hypeMemeMarket: Market;

    hypeMeme: HypeMeme;
    hypeMemeNftPrice: bigint;

    degenGateInfo: DegenGateAllContractInfo;
};


export async function deployHypeMemeAllContract(degenGateAllContractInfo: DegenGateAllContractInfo): Promise<HypeMemeAllContractInfo> {
    let startIndex = degenGateAllContractInfo.nextWalletIndex;

    let wallets = await ethers.getSigners();
    let deployWalletIndex = degenGateAllContractInfo.deployWalletIndex;
    let deployWallet: HardhatEthersSigner = degenGateAllContractInfo.deployWallet;
    let signatureWalletIndex = degenGateAllContractInfo.signatureWalletIndex;
    let signatureWallet: HardhatEthersSigner = degenGateAllContractInfo.signatureWallet;
    let userWalletIndex = degenGateAllContractInfo.userWalletIndex;
    let userWallet: HardhatEthersSigner = degenGateAllContractInfo.userWallet;
    let mortgageFeeWalletIndex = degenGateAllContractInfo.mortgageFeeWalletIndex;
    let mortgageFeeWallet: HardhatEthersSigner = degenGateAllContractInfo.mortgageFeeWallet;

    let hypeMemeOwnerWalletIndex = startIndex;
    let hypeMemeOwnerWallet: HardhatEthersSigner = wallets[hypeMemeOwnerWalletIndex];
    let hypeMemeFundRecipientWalletIndex = startIndex + 1;
    let hypeMemeFundRecipientWallet: HardhatEthersSigner = wallets[hypeMemeFundRecipientWalletIndex];

    let nextWalletIndex = startIndex + 2;
    let mortgageFee = 1000;

    let hypeMemeBuyFee = 1000;
    let hypeMemeSellFee = 1000;
    let hypeMemeAppId = 2;
    let hypeMemeAppName = "hypeMeme";

    let mockDegen: MockDegen = degenGateAllContractInfo.mockDegen;
    let foundry: Foundry = degenGateAllContractInfo.foundry;
    let publicNFTFactory: PublicNFTFactory = degenGateAllContractInfo.publicNFTFactory;
    let mortgageNFTFactory: MortgageNFTFactory = degenGateAllContractInfo.mortgageNFTFactory;
    let marketFactory: MarketFactory = degenGateAllContractInfo.marketFactory;
    let point: Point = degenGateAllContractInfo.point;

    let hypeMemePublicNFT: PublicNFT;
    let hypeMemeMortgageNFT: MortgageNFT;
    let hypeMemeMarket: Market;

    let hypeMeme: HypeMeme;
    let hypeMemeNftPrice: bigint = BigInt(10) ** BigInt(18) * BigInt(2000);

    let degenGateInfo: DegenGateAllContractInfo = degenGateAllContractInfo;

    // deploy curve
    let hypeMemeCurve = (await (await ethers.getContractFactory("HypeMemeCurve")).deploy()) as HypeMemeCurve;

    let addressInfo = await getAllContractAddress(deployWallet);

    // create hypeMeme app
    await foundry.createApp(hypeMemeAppName, hypeMemeOwnerWallet.address, addressInfo.hypeMeme, await hypeMemeCurve.getAddress(), await point.getAddress(), hypeMemeBuyFee, hypeMemeSellFee);

    let hypeMemeInfo = await foundry.apps(hypeMemeAppId);
    hypeMemePublicNFT = (await ethers.getContractAt("PublicNFT", hypeMemeInfo.publicNFT)) as PublicNFT;
    hypeMemeMortgageNFT = (await ethers.getContractAt("MortgageNFT", hypeMemeInfo.mortgageNFT)) as MortgageNFT;
    hypeMemeMarket = (await ethers.getContractAt("Market", hypeMemeInfo.market)) as Market;

    // deploy hypeMeme
    const hypeMeme__factory = await ethers.getContractFactory("HypeMeme");
    const h = await upgrades.deployProxy(hypeMeme__factory, [
        await degenGateAllContractInfo.foundry.getAddress(),
        hypeMemeAppId,
        await hypeMemeMortgageNFT.getAddress(),
        await hypeMemeMarket.getAddress(),
        await mockDegen.getAddress(),
        await degenGateAllContractInfo.degenGate.getAddress(),
        hypeMemeNftPrice,
        hypeMemeFundRecipientWallet.address,
        signatureWallet.address,
    ]);
    await h.waitForDeployment();

    hypeMeme = (await ethers.getContractAt("HypeMeme", await h.getAddress())) as HypeMeme;
    expect(await hypeMeme.appId()).eq(hypeMemeAppId)
    expect(await hypeMeme.foundry()).eq(await foundry.getAddress())

    expect(await hypeMeme.nftPrice()).eq(hypeMemeNftPrice)
    expect(await hypeMeme.fundRecipient()).eq(hypeMemeFundRecipientWallet.address)
    expect(await hypeMeme.signatureAddress()).eq(signatureWallet.address)
    expect(await hypeMeme.getAddress()).eq(addressInfo.hypeMeme);
    expect(await hypeMeme.degenGate()).eq(await degenGateAllContractInfo.degenGate.getAddress());
    expect(await hypeMeme.foundry()).eq(await degenGateAllContractInfo.foundry.getAddress());

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

        hypeMemeOwnerWalletIndex,
        hypeMemeOwnerWallet,
        hypeMemeFundRecipientWalletIndex,
        hypeMemeFundRecipientWallet,

        nextWalletIndex,
        mortgageFee,

        hypeMemeBuyFee,
        hypeMemeSellFee,
        hypeMemeAppId,
        hypeMemeAppName,

        mockDegen,
        foundry,
        publicNFTFactory,
        mortgageNFTFactory,
        marketFactory,
        hypeMemeCurve,
        point,

        hypeMemePublicNFT,
        hypeMemeMortgageNFT,
        hypeMemeMarket,

        hypeMeme,
        hypeMemeNftPrice,

        degenGateInfo,
    };
}
