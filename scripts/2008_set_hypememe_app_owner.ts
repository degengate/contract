import { ethers } from "hardhat";
import { expect } from "chai";

import {
    appid,
    foundryAddress,
    hypeMemeAddress,
    hypeMemePublicNFTAddress,
    hypeMemeMortgageNFTAddress,
} from "./hype_meme_params.json";
import config from "./config.json";

async function main() {
    let mw_address: string = process.env.MW_ADDRESS || "";
    if (mw_address.length === 0) {
        throw new Error("MW_ADDRESS is empty");
    }

    const foundry = await ethers.getContractAt("Foundry", foundryAddress);
    const hypeMeme = await ethers.getContractAt("HypeMeme", hypeMemeAddress);
    const publicNFT = await ethers.getContractAt("PublicNFT", hypeMemePublicNFTAddress);
    const mortgageNFT = await ethers.getContractAt("MortgageNFT", hypeMemeMortgageNFTAddress);

    // hypeMeme
    const a = await hypeMeme.transferOwnership(mw_address, {
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    });
    const result1 = await a.wait();
    console.log(`hypeMeme transferOwnership to ${mw_address} at ${result1?.hash}`);

    // hypeMeme app owner
    let info = await foundry.apps(appid)
    const b = await foundry.setAppOwner(appid, mw_address, {
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    });
    const result2 = await b.wait();
    console.log(`foundry app ${info.name} setAppOwner to ${mw_address} at ${result2?.hash}`);

    // public nft owner
    const c = await publicNFT.transferOwnership(mw_address, {
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    });
    const result3 = await c.wait();
    console.log(`publicNFT transferOwnership to ${mw_address} at ${result3?.hash}`);

    // mortgage nft owner
    const d = await mortgageNFT.transferOwnership(mw_address, {
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    });
    const result4 = await d.wait();
    console.log(`mortgageNFT transferOwnership to ${mw_address} at ${result4?.hash}`);

    // check
    expect(await hypeMeme.owner()).eq(mw_address);
    expect(await publicNFT.owner()).eq(mw_address);
    expect(await mortgageNFT.owner()).eq(mw_address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
