import { ethers } from "hardhat";
import { expect } from "chai";

import {
    foundryDataAddress,
    foundryAddress
} from "./params.json";

async function main() {
    const foundryData = await ethers.getContractAt("FoundryData", foundryDataAddress);

    await foundryData.updateFoundryWhitelist(
        foundryAddress, true
    );

    console.log("check ...");

    expect(await foundryData.foundryWhitelist(foundryAddress)).eq(true);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
