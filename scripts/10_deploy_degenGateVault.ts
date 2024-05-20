import { ethers } from "hardhat";
import { expect } from "chai";

import {
    degenGateAddress,
    begenAddress,
    degenAddress,
    degenGateVaultAddress,
} from "./params.json";
import config from "./config.json";

async function main() {
    const wallets = await ethers.getSigners();
    const deployWallet = wallets[0];

    const degenGateVault = await ethers.deployContract(
        "DegenGateVault",
        [
            degenGateAddress,
            begenAddress,
            degenAddress,
        ],
        {
            maxFeePerGas: config.maxFeePerGas,
            maxPriorityFeePerGas: config.maxPriorityFeePerGas,
            nonce: config.nonce0 + 10,
        },
    );

    await degenGateVault.waitForDeployment();

    console.log(`DegenGateVault deployed to ${degenGateVault.target}`);

    expect(degenGateVault.target).eq(degenGateVaultAddress);

    console.log("check ...");

    const degenGateVaultCon = await ethers.getContractAt("DegenGateVault", degenGateVaultAddress);

    expect(await degenGateVaultCon.degenGate()).eq(degenGateAddress);
    expect(await degenGateVaultCon.degen()).eq(degenAddress);
    expect(await degenGateVaultCon.begen()).eq(begenAddress);

    expect(await degenGateVaultCon.owner()).eq(deployWallet.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
