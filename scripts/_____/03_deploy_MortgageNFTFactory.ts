import { ethers } from "hardhat";
import { expect } from "chai";

import { foundryAddress } from "./params.json";

async function main() {
    const mortgageNFTFactory = await ethers.deployContract("MortgageNFTFactory", [foundryAddress]);

    await mortgageNFTFactory.waitForDeployment();

    console.log(`MortgageNFTFactory deployed to ${mortgageNFTFactory.target}`);

    console.log("check ...");

    expect(await mortgageNFTFactory.foundry()).eq(foundryAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
