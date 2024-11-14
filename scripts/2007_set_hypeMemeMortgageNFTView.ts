import { ethers } from "hardhat";
import { expect } from "chai";

import { hypeMemeMortgageNFTViewAddress, hypeMemeMortgageNFTAddress } from "./hype_meme_params.json";
import config from "./config.json";

async function main() {
    const mortgageNFT = await ethers.getContractAt("MortgageNFT", hypeMemeMortgageNFTAddress);

    const a = await mortgageNFT.setMortgageNFTView(hypeMemeMortgageNFTViewAddress, {
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas,
    });
    const result = await a.wait();

    console.log(`hypeMemeMortgageNFT setMortgageNFTView ${hypeMemeMortgageNFTViewAddress} at ${result?.hash}`);

    expect(await mortgageNFT.mortgageNFTView()).eq(hypeMemeMortgageNFTViewAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
