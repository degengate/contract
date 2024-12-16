import { ethers } from "hardhat";
import { expect } from "chai";

import { foundryAddress } from "./params.json";

async function main() {
    const tokenFactory = await ethers.deployContract("TokenFactory", [foundryAddress]);

    await tokenFactory.waitForDeployment();

    console.log(`TokenFactory deployed to ${tokenFactory.target}`);

    console.log("check ...");

    expect(await tokenFactory.foundry()).eq(foundryAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
