import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-insight";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-ledger";

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
      // ledgerAccounts: process.env.LEDGER_DEPLOY_ADDRESS !== undefined ? [process.env.LEDGER_DEPLOY_ADDRESS] : [],
      accounts: process.env.BASE_SEPOLIA_PRIVATE_KEY !== undefined && process.env.SIGN_PRIVATE_KEY !== undefined ? [process.env.BASE_SEPOLIA_PRIVATE_KEY, process.env.SIGN_PRIVATE_KEY] : [],
    },
    base: {
      url: `${process.env.BASE_RPC_URL}`,
      // ledgerAccounts: process.env.LEDGER_DEPLOY_ADDRESS !== undefined ? [process.env.LEDGER_DEPLOY_ADDRESS] : [],
      accounts: process.env.BASE_PRIVATE_KEY !== undefined && process.env.SIGN_PRIVATE_KEY !== undefined ? [process.env.BASE_PRIVATE_KEY, process.env.SIGN_PRIVATE_KEY] : [],
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
