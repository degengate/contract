import { ethers } from "hardhat";

import config from "./config.json";

async function main() {
    const hypeMemeCurve = await ethers.deployContract("HypeMemeCurve", [], {
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas
    });

    await hypeMemeCurve.waitForDeployment();

    console.log(`HypeMemeCurve deployed to ${hypeMemeCurve.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
