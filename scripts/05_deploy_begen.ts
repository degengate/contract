import { ethers } from "hardhat";
import { expect } from "chai";

import { begenAddress, degenGateAddress, degenGateVaultAddress } from "./params.json";
import config from "./config.json";

async function main() {
    const begen = await ethers.deployContract(
        "Begen",
        [degenGateAddress, degenGateVaultAddress],
        {
            maxFeePerGas: config.maxFeePerGas,
            maxPriorityFeePerGas: config.maxPriorityFeePerGas,
            nonce: config.nonce0 + 5,
        }
    );

    await begen.waitForDeployment();

    console.log(`Begen deployed to ${begen.target}`);

    expect(begen.target).eq(begenAddress);

    console.log("check ...");

    const begenCon = await ethers.getContractAt("Begen", begenAddress);

    expect(await begenCon.degenGate()).eq(degenGateAddress);
    expect(await begenCon.vault()).eq(degenGateVaultAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
