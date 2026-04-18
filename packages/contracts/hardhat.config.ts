import "dotenv/config";
import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun"
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    zamaTestnet: {
      url: process.env.ZAMA_TESTNET_RPC_URL ?? "",
      accounts: privateKey ? [privateKey] : []
    }
  }
};

export default config;
