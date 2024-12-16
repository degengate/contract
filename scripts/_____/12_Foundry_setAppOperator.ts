import { ethers } from "hardhat";
import { expect } from "chai";

import {
    appid,
    foundryAddress,
    xMemeAddress,
} from "./params.json";

async function main() {
    const foundry = await ethers.getContractAt("Foundry", foundryAddress);

    await foundry.setAppOperator(
        appid,
        xMemeAddress
    );

    console.log("check ...");

    expect((await foundry.apps(appid)).operator).eq(xMemeAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
