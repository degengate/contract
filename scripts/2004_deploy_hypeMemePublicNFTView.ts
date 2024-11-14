import { ethers } from "hardhat";
import { expect } from "chai";

import {
    appid,
    foundryAddress,
    hypeMemePublicNFTAddress,
    hypeMemePublicNFTViewAddress,
} from "./hype_meme_params.json";
import config from "./config.json";

async function main() {
    const hypeMemePublicNFTView = await ethers.deployContract(
        "HypeMemePublicNFTView",
        [foundryAddress, appid, hypeMemePublicNFTAddress],
        {
            maxFeePerGas: config.maxFeePerGas,
            maxPriorityFeePerGas: config.maxPriorityFeePerGas,
        },
    );

    await hypeMemePublicNFTView.waitForDeployment();

    console.log(`HypeMemePublicNFTView deployed to ${hypeMemePublicNFTView.target}`);

    console.log("check ...");
    expect(hypeMemePublicNFTViewAddress).eq(hypeMemePublicNFTView.target)

    const publicNFTViewCon = await ethers.getContractAt("HypeMemePublicNFTView", hypeMemePublicNFTViewAddress);

    expect(await publicNFTViewCon.appId()).eq(appid);
    expect(await publicNFTViewCon.foundry()).eq(foundryAddress);
    expect(await publicNFTViewCon.publicNFT()).eq(hypeMemePublicNFTAddress);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
