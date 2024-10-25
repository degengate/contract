import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

import {
    degenAddress,
    pointAddress,
    foundryAddress,
    degenGateAddress,
    appid,
    nftPrice,
    hypeMemeMortgageNFTAddress,
    hypeMemeMarketAddress,
    hypeMemeAddress,
    hypeMemeFundRecipientWalletAddress,
    signatureWalletAddress,
} from "./hype_meme_params.json";
import config from "./config.json";

async function main() {
    const wallets = await ethers.getSigners();
    const deployWallet = wallets[0];

    const HypeMeme = await ethers.getContractFactory("HypeMeme");
    const hypeMeme = await upgrades.deployProxy(HypeMeme, [
        foundryAddress,
        appid,
        hypeMemeMortgageNFTAddress,
        hypeMemeMarketAddress,
        degenAddress,
        degenGateAddress,
        nftPrice,
        hypeMemeFundRecipientWalletAddress,
        signatureWalletAddress,
    ], {
        txOverrides: {
            maxFeePerGas: config.maxFeePerGas,
            maxPriorityFeePerGas: config.maxPriorityFeePerGas,
        },
    });
    await hypeMeme.waitForDeployment();
    console.log("hypeMeme deployed to:", hypeMeme.target);

    expect(hypeMeme.target).eq(hypeMemeAddress);

    console.log("check ...");

    const hypeMemeCon = await ethers.getContractAt("HypeMeme", hypeMemeAddress);

    expect(await hypeMemeCon.foundry()).eq(foundryAddress);
    expect(await hypeMemeCon.appId()).eq(appid);
    expect(await hypeMemeCon.mortgageNFT()).eq(hypeMemeMortgageNFTAddress);
    expect(await hypeMemeCon.market()).eq(hypeMemeMarketAddress);
    expect(await hypeMemeCon.degen()).eq(degenAddress);
    expect(await hypeMemeCon.degenGate()).eq(degenGateAddress);
    expect(await hypeMemeCon.nftPrice()).eq(nftPrice);
    expect(await hypeMemeCon.fundRecipient()).eq(hypeMemeFundRecipientWalletAddress);
    expect(await hypeMemeCon.signatureAddress()).eq(signatureWalletAddress);

    expect(await hypeMemeCon.point()).eq(pointAddress);
    expect(await hypeMemeCon.owner()).eq(deployWallet.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
