import { ethers } from "hardhat";
import { expect } from "chai";

import {
    xMemeAddress,
} from "./params.json";

async function main() {
    const xMeme = await ethers.getContractAt("XMeme", xMemeAddress);

    await xMeme.setSystemReady(true);

    console.log("check ...");

    expect(await xMeme.isSystemReady()).eq(true);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
