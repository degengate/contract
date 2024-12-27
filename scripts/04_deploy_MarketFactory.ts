import { ethers } from "hardhat";
import { expect } from "chai";

import { foundryAddress } from "./params.json";

async function main() {
    const marketFactory = await ethers.deployContract("MarketFactory", [foundryAddress]);

    await marketFactory.waitForDeployment();

    console.log(`MarketFactory deployed to ${marketFactory.target}`);

    console.log("check ...");

    expect(await marketFactory.foundry()).eq(foundryAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
