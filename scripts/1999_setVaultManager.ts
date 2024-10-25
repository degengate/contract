import { ethers } from "hardhat";

import {
    degenGateAddress,
} from "./params.json";
import {
    hypeMemeAddress,
} from "./hype_meme_params.json";
import config from "./config.json";

async function main() {
    const degenGate = await ethers.getContractAt("DegenGate", degenGateAddress);
    let a = await degenGate.setVaultManager(hypeMemeAddress, true, {
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas
    })
    const result1 = await a.wait();
    console.log(`setVaultManager at ${result1?.hash}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
