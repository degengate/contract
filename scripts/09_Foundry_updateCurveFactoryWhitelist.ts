import { ethers } from "hardhat";
import { expect } from "chai";

import {
    foundryAddress,
    cPFCurveFactoryAddress,
} from "./params.json";

async function main() {
    const foundry = await ethers.getContractAt("Foundry", foundryAddress);

    await foundry.updateCurveFactoryWhitelist(
        cPFCurveFactoryAddress, true
    );

    console.log("check ...");

    expect(await foundry.curveFactoryWhitelist(cPFCurveFactoryAddress)).eq(true);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
