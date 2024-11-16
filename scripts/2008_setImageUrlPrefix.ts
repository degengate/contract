


import { ethers } from "hardhat";
import { expect } from "chai";

import { hypeMemePublicNFTViewAddress, hypeMemeMortgageNFTViewAddress } from "./hype_meme_params.json";
import config from "./config.json";

async function main() {
    let urlPrefix = "https://yellow-select-rat-115.mypinata.cloud/ipfs/"

    const publicNFTView = await ethers.getContractAt("HypeMemePublicNFTView", hypeMemePublicNFTViewAddress);
    const a = await publicNFTView.setImageUrlPrefix(urlPrefix, {
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    });
    const result = await a.wait();
    console.log(`HypeMemePublicNFTView setImageUrlPrefix ${urlPrefix} at ${result?.hash}`);
    expect(await publicNFTView.imageUrlPrefix()).eq(urlPrefix);

    const mortgageNFTView = await ethers.getContractAt("HypeMemeMortgageNFTView", hypeMemeMortgageNFTViewAddress);
    const b = await mortgageNFTView.setImageUrlPrefix(urlPrefix, {
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    });
    const result2 = await b.wait();
    console.log(`hypeMemeMortgageNFTView setImageUrlPrefix ${urlPrefix} at ${result2?.hash}`);
    expect(await mortgageNFTView.imageUrlPrefix()).eq(urlPrefix);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
