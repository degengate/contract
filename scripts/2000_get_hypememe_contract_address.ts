import { ethers } from "hardhat";
import { getAllContractAddress } from "../test/shared/deploy_hype_meme";
import {
    foundryAddress,
    curveAddress,
    pointAddress,
    degenAddress,
    degenGateAddress,
    publicNFTFactoryAddress,
    mortgageNFTFactoryAddress,
    marketFactoryAddress,
    signatureWalletAddress
} from "./params.json";

let hypeMeme_appid = 2;

async function main() {
    const wallets = await ethers.getSigners();
    const deployWallet = wallets[0];
    const info = await getAllContractAddress(deployWallet);

    let hypeMemePublicNFT = ethers.getCreateAddress({
        from: publicNFTFactoryAddress,
        nonce: hypeMeme_appid,
    });
    let hypeMemeMortgageNFT = ethers.getCreateAddress({
        from: mortgageNFTFactoryAddress,
        nonce: hypeMeme_appid,
    });
    let hypeMemeMarket = ethers.getCreateAddress({
        from: marketFactoryAddress,
        nonce: hypeMeme_appid,
    });

    let mw_address: string = process.env.MW_ADDRESS || "";
    if (mw_address.length === 0) {
        throw new Error("MW_ADDRESS is empty");
    }

    const output = {
        foundryAddress: foundryAddress,
        curveAddress: curveAddress,
        pointAddress: pointAddress,
        degenAddress: degenAddress,
        degenGateAddress: degenGateAddress,
        appid: hypeMeme_appid,
        mortgageFee: 100,
        buyFee: 1000,
        sellFee: 1000,
        nftPrice: "2000000000000000000000",
        hypeMemePublicNFTAddress: hypeMemePublicNFT,
        hypeMemeMortgageNFTAddress: hypeMemeMortgageNFT,
        hypeMemeMarketAddress: hypeMemeMarket,
        hypeMemeAddress: info.hypeMeme,
        hypeMemeFundRecipientWalletAddress: mw_address,
        signatureWalletAddress: signatureWalletAddress
    }

    console.log("=== hype_meme_params.json start ===");
    console.log(output);
    console.log("=== hype_meme_params.json end ===");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
