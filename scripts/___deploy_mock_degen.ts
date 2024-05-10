import { ethers } from "hardhat";
import config from "./config.json";

async function main() {
    const amount = BigInt(10) ** BigInt(29)
    const mockDegen = await ethers.deployContract(
        "MockDegen",
        [amount],
        {
            maxFeePerGas: config.maxFeePerGas,
            maxPriorityFeePerGas: config.maxPriorityFeePerGas,
        },
    );

    await mockDegen.waitForDeployment();

    console.log(`MockDegen deployed to ${mockDegen.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
