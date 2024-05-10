import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-insight";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: false,
      optimizer: {
        enabled: true,
        runs: 800,
      },
      metadata: {
        bytecodeHash: "none",
      },
    },
  },
  networks: {
    "base-sepolia": {
      url: `${process.env.BASE_SEPOLIA_RPC_URL}`,
      accounts: process.env.BASE_SEPOLIA_PRIVATE_KEY !== undefined && process.env.SIGN_PRIVATE_KEY !== undefined ? [process.env.BASE_SEPOLIA_PRIVATE_KEY, process.env.SIGN_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.SCAN_API_KEY,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;
