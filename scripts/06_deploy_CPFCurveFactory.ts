import { ethers } from "hardhat";
import { expect } from "chai";

import { foundryAddress } from "./params.json";

async function main() {
    const cPFCurveFactory = await ethers.deployContract("CPFCurveFactory", [foundryAddress]);

    await cPFCurveFactory.waitForDeployment();

    console.log(`cPFCurveFactory deployed to ${cPFCurveFactory.target}`);

    console.log("check ...");

    expect(await cPFCurveFactory.foundry()).eq(foundryAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
