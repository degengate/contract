import { ethers } from "hardhat";
import { expect } from "chai";

import {
    appid,
    foundryAddress,
    hypeMemeMortgageNFTAddress,
    hypeMemeMortgageNFTViewAddress
} from "./hype_meme_params.json";
import config from "./config.json";

async function main() {
    const hypeMemeMortgageNFTView = await ethers.deployContract(
        "HypeMemeMortgageNFTView",
        [foundryAddress, appid, hypeMemeMortgageNFTAddress],
        {
            maxFeePerGas: config.maxFeePerGas,
            maxPriorityFeePerGas: config.maxPriorityFeePerGas,
        },
    );

    await hypeMemeMortgageNFTView.waitForDeployment();

    console.log(`hypeMemeMortgageNFTView deployed to ${hypeMemeMortgageNFTView.target}`);
    console.log("check ...");

    expect(hypeMemeMortgageNFTViewAddress).eq(hypeMemeMortgageNFTView.target);

    const mortgageNFTViewCon = await ethers.getContractAt("HypeMemeMortgageNFTView", hypeMemeMortgageNFTViewAddress);

    expect(await mortgageNFTViewCon.appId()).eq(appid);
    expect(await mortgageNFTViewCon.foundry()).eq(foundryAddress);
    expect(await mortgageNFTViewCon.mortgageNFT()).eq(hypeMemeMortgageNFTAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
