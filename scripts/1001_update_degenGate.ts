import { ethers, upgrades } from "hardhat";

import {
    degenGateAddress,
} from "./params.json";

async function main() {
    const DegenGate = await ethers.getContractFactory("DegenGate");
    const degenGatenewVersion = await upgrades.upgradeProxy(degenGateAddress, DegenGate)
    console.log("degenGatenewVersion")
    console.log(degenGatenewVersion.target)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
