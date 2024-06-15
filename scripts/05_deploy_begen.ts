import { ethers } from "hardhat";
import { expect } from "chai";

import { pointAddress, degenGateAddress, degenGateVaultAddress } from "./params.json";
import config from "./config.json";

async function main() {
    const point = await ethers.deployContract(
        "Point",
        [degenGateAddress, degenGateVaultAddress],
        {
            maxFeePerGas: config.maxFeePerGas,
            maxPriorityFeePerGas: config.maxPriorityFeePerGas,
            nonce: config.nonce0 + 5,
        }
    );

    await point.waitForDeployment();

    console.log(`Point deployed to ${point.target}`);

    expect(point.target).eq(pointAddress);

    console.log("check ...");

    const pointCon = await ethers.getContractAt("Point", pointAddress);

    expect(await pointCon.degenGate()).eq(degenGateAddress);
    expect(await pointCon.vault()).eq(degenGateVaultAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
