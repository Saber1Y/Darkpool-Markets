import "dotenv/config";
import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const sepoliaRpc = process.env.SEPOLIA_RPC_URL ?? process.env.ZAMA_TESTNET_RPC_URL ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun"
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      blockGasLimit: 50_000_000
    },
    sepolia: {
      url: sepoliaRpc,
      accounts: privateKey ? [privateKey] : []
    },
    // Backward-compatible alias for existing scripts/docs.
    zamaTestnet: {
      url: sepoliaRpc,
      accounts: privateKey ? [privateKey] : []
    }
  }
};

export default config;
