import { ethers } from "hardhat";
import { expect } from "chai";

import { foundryAddress } from "./params.json";

async function main() {
    const feeNFTFactory = await ethers.deployContract("FeeNFTFactory", [foundryAddress]);

    await feeNFTFactory.waitForDeployment();

    console.log(`FeeNFTFactory deployed to ${feeNFTFactory.target}`);

    console.log("check ...");

    expect(await feeNFTFactory.foundry()).eq(foundryAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
