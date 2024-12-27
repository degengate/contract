import { ethers } from "hardhat";


async function main() {
  const foundryData = await ethers.deployContract(
    "FoundryData", [],
  );

  await foundryData.waitForDeployment();

  console.log(`FoundryData deployed to ${foundryData.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
