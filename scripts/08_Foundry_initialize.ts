import { ethers } from "hardhat";
import { expect } from "chai";

import {
    foundryAddress,
    feeNFTFactoryAddress,
    mortgageNFTFactoryAddress,
    marketFactoryAddress,
    tokenFactoryAddress,
} from "./params.json";

async function main() {
    const foundry = await ethers.getContractAt("Foundry", foundryAddress);

    await foundry.initialize(
        feeNFTFactoryAddress,
        mortgageNFTFactoryAddress,
        marketFactoryAddress,
        tokenFactoryAddress
    );

    console.log("check ...");

    expect(await foundry.isInitialized()).eq(true);
    expect(await foundry.feeNFTFactory()).eq(feeNFTFactoryAddress);
    expect(await foundry.mortgageNFTFactory()).eq(mortgageNFTFactoryAddress);
    expect(await foundry.marketFactory()).eq(marketFactoryAddress);
    expect(await foundry.tokenFactory()).eq(tokenFactoryAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
