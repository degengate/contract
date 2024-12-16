import { ethers, upgrades } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";

import {
    MortgageNFT,
    Market,
    FeeNFT,
    ICurve,
    XMeme
} from "../../typechain-types";
import { CoreContractInfo } from "./deploy_foundry";
import { ZeroAddress } from "ethers";

export type XMemeAllContractInfo = {
    wallets: any;
    deployWalletIndex: number;
    deployWallet: HardhatEthersSigner;
    platformMortgageFeeWalletIndex: number;
    platformMortgageFeeWallet: HardhatEthersSigner;

    appOwnerWalletIndex: number;
    appOwnerWallet: HardhatEthersSigner;

    appOwnerFeeWalletIndex: number;
    appOwnerFeeWallet: HardhatEthersSigner;

    fundRecipientWalletIndex: number;
    fundRecipientWallet: HardhatEthersSigner;

    signatureWalletIndex: number;
    signatureWallet: HardhatEthersSigner;

    userWalletIndex: number;
    userWallet: HardhatEthersSigner;

    nextWalletIndex: number;


    appOwnerBuyFee: number;
    appOwnerSellFee: number;
    appOwnerMortgageFee: number;
    feeNftBuyFee: number;
    feeNftSellFee: number;
    platformMortgageFee: number;
    firstBuyFee: bigint;

    appId: bigint;
    appName: string;
    feeNFT: FeeNFT;
    mortgageNFT: MortgageNFT;
    market: Market;
    curve: ICurve;
    xMeme: XMeme;

};


export async function deployXMemeAllContract(coreContractInfo: CoreContractInfo): Promise<XMemeAllContractInfo> {
    let startIndex = coreContractInfo.nextWalletIndex;

    let wallets = coreContractInfo.wallets
    let deployWalletIndex = coreContractInfo.deployWalletIndex
    let deployWallet = coreContractInfo.deployWallet;
    let platformMortgageFeeWalletIndex = coreContractInfo.defaultMortgageFeeWalletIndex;
    let platformMortgageFeeWallet = coreContractInfo.defaultMortgageFeeWallet;

    let appOwnerWalletIndex = startIndex;
    let appOwnerWallet = wallets[appOwnerWalletIndex];

    let appOwnerFeeWalletIndex = startIndex + 1;
    let appOwnerFeeWallet = wallets[appOwnerFeeWalletIndex];

    let fundRecipientWalletIndex = startIndex + 2;
    let fundRecipientWallet = wallets[fundRecipientWalletIndex];

    let signatureWalletIndex = startIndex + 3;
    let signatureWallet = wallets[signatureWalletIndex]

    let userWalletIndex = startIndex + 4;
    let userWallet = wallets[userWalletIndex]

    let nextWalletIndex = startIndex + 5;

    let appOwnerBuyFee = 600;
    let appOwnerSellFee = 600;
    let appOwnerMortgageFee = 300;
    let feeNftBuyFee = 1000;
    let feeNftSellFee = 1000;
    let platformMortgageFee = coreContractInfo.defaultMortgageFee;
    let firstBuyFee = BigInt(10) ** BigInt(16);

    let appId = await coreContractInfo.foundry.nextAppId();
    let appName = "XMeme";
    let feeNFT: FeeNFT;
    let mortgageNFT: MortgageNFT;
    let market: Market;
    let curve: ICurve;
    let xMeme: XMeme;

    let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"],
        [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
    )

    // create xMeme app
    await coreContractInfo.foundry.createApp(
        appName,
        await appOwnerWallet.getAddress(),
        await coreContractInfo.cpfCurveFactory.getAddress(),
        curveParams,
        ZeroAddress,
        {
            appOwnerBuyFee: appOwnerBuyFee,
            appOwnerSellFee: appOwnerSellFee,
            appOwnerMortgageFee: appOwnerMortgageFee,
            appOwnerFeeRecipient: await appOwnerFeeWallet.getAddress(),
            nftOwnerBuyFee: feeNftBuyFee,
            nftOwnerSellFee: feeNftSellFee,
        }
    );


    let xMemeInfo = await coreContractInfo.foundry.apps(appId);
    feeNFT = (await ethers.getContractAt("FeeNFT", xMemeInfo.feeNFT)) as FeeNFT;
    mortgageNFT = (await ethers.getContractAt("MortgageNFT", xMemeInfo.mortgageNFT)) as MortgageNFT;
    market = (await ethers.getContractAt("Market", xMemeInfo.market)) as Market;
    curve = (await ethers.getContractAt("ICurve", xMemeInfo.curve)) as ICurve;

    // deploy xMeme
    const xMeme__factory = await ethers.getContractFactory("XMeme");
    const h = await upgrades.deployProxy(xMeme__factory, [
        await coreContractInfo.foundry.getAddress(),
        appId,
        await feeNFT.getAddress(),
        await mortgageNFT.getAddress(),
        await market.getAddress(),
        firstBuyFee,
        await fundRecipientWallet.getAddress(),
        await signatureWallet.getAddress()
    ]);
    await h.waitForDeployment();

    xMeme = (await ethers.getContractAt("XMeme", await h.getAddress())) as XMeme;

    await coreContractInfo.foundry.connect(appOwnerWallet).setAppOperator(appId, await xMeme.getAddress());

    xMemeInfo = await coreContractInfo.foundry.apps(appId);
    feeNFT = (await ethers.getContractAt("FeeNFT", xMemeInfo.feeNFT)) as FeeNFT;
    mortgageNFT = (await ethers.getContractAt("MortgageNFT", xMemeInfo.mortgageNFT)) as MortgageNFT;
    market = (await ethers.getContractAt("Market", xMemeInfo.market)) as Market;
    curve = (await ethers.getContractAt("ICurve", xMemeInfo.curve)) as ICurve;


    let xMemeFeeInfo = await coreContractInfo.foundry.appFees(appId);
    expect(xMemeFeeInfo.appOwnerBuyFee).eq(appOwnerBuyFee)
    expect(xMemeFeeInfo.appOwnerSellFee).eq(appOwnerSellFee)
    expect(xMemeFeeInfo.appOwnerMortgageFee).eq(appOwnerMortgageFee)
    expect(xMemeFeeInfo.appOwnerFeeRecipient).eq(await appOwnerFeeWallet.getAddress())

    expect(xMemeFeeInfo.nftOwnerBuyFee).eq(feeNftBuyFee)
    expect(xMemeFeeInfo.nftOwnerSellFee).eq(feeNftSellFee)
    expect(xMemeFeeInfo.platformMortgageFee).eq(platformMortgageFee)
    expect(xMemeFeeInfo.platformMortgageFeeRecipient).eq(await platformMortgageFeeWallet.getAddress())

    expect(xMemeInfo.name).eq(appName)
    expect(xMemeInfo.owner).eq(await appOwnerWallet.getAddress())
    expect(xMemeInfo.operator).eq(await xMeme.getAddress())
    expect(xMemeInfo.payToken).eq(ZeroAddress)
    expect(xMemeInfo.foundry).eq(await coreContractInfo.foundry.getAddress())

    expect(await xMeme.appId()).eq(appId)
    expect(await xMeme.foundry()).eq(await coreContractInfo.foundry.getAddress())

    expect(await xMeme.feeNFT()).eq(await feeNFT.getAddress())
    expect(await xMeme.mortgageNFT()).eq(await mortgageNFT.getAddress())
    expect(await xMeme.market()).eq(await market.getAddress())

    expect(await xMeme.firstBuyFee()).eq(firstBuyFee)
    expect(await xMeme.fundRecipient()).eq(await fundRecipientWallet.getAddress())
    expect(await xMeme.signatureAddress()).eq(signatureWallet.address)

    expect(await xMeme.isSystemReady()).eq(false)

    return {
        wallets,
        deployWalletIndex,
        deployWallet,
        platformMortgageFeeWalletIndex,
        platformMortgageFeeWallet,

        appOwnerWalletIndex,
        appOwnerWallet,

        appOwnerFeeWalletIndex,
        appOwnerFeeWallet,

        fundRecipientWalletIndex,
        fundRecipientWallet,

        signatureWalletIndex,
        signatureWallet,

        userWalletIndex,
        userWallet,

        nextWalletIndex,

        appOwnerBuyFee,
        appOwnerSellFee,
        appOwnerMortgageFee,
        feeNftBuyFee,
        feeNftSellFee,
        platformMortgageFee,
        firstBuyFee,

        appId,
        appName,
        feeNFT,
        mortgageNFT,
        market,
        curve,
        xMeme,
    };
}
