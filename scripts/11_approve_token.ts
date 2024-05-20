import { ethers } from "hardhat";

import {
    degenGateVaultAddress,
} from "./params.json";
import config from "./config.json";

async function main() {
    const degenGateVaultCon = await ethers.getContractAt("DegenGateVault", degenGateVaultAddress);

    let a = await degenGateVaultCon.addApproveDegen({
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas,
        nonce: config.nonce0 + 11,
    })
    const result1 = await a.wait();
    console.log(`addApproveDegen at ${result1?.hash}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
