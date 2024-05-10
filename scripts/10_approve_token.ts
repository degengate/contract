import { ethers } from "hardhat";

import {
    degenGateVaultAddress,
} from "./params.json";

async function main() {
    const degenGateVaultCon = await ethers.getContractAt("DegenGateVault", degenGateVaultAddress);

    let a = await degenGateVaultCon.addApproveDegen()
    const result1 = await a.wait();
    console.log(`addApproveDegen at ${result1?.hash}`);

    let b = await degenGateVaultCon.approveBegen(BigInt(2) ** BigInt(256) - BigInt(1))
    const result2 = await b.wait();
    console.log(`approveBegen at ${result2?.hash}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
