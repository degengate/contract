import { ethers } from "hardhat";
import { expect } from "chai";

import { hypeMemePublicNFTViewAddress, hypeMemePublicNFTAddress } from "./hype_meme_params.json";
import config from "./config.json";

async function main() {
    const publicNFT = await ethers.getContractAt("PublicNFT", hypeMemePublicNFTAddress);

    const a = await publicNFT.setPublicNFTView(hypeMemePublicNFTViewAddress, {
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    });
    const result = await a.wait();

    console.log(`hypeMemePublicNFT setPublicNFTView ${hypeMemePublicNFTViewAddress} at ${result?.hash}`);

    expect(await publicNFT.publicNFTView()).eq(hypeMemePublicNFTViewAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
