import { ethers } from "hardhat";

function parseDurationSec(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid MARKET_DURATION_SECONDS: ${value}`);
  }
  return parsed;
}

async function main() {
  const [sender] = await ethers.getSigners();
  const factoryAddress = process.env.FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error("Missing FACTORY_ADDRESS env var");
  }

  const question = process.env.MARKET_QUESTION ?? "Will ETH close above $5k this month?";
  const metadataURI = process.env.MARKET_METADATA_URI ?? "ipfs://darkpool-market";
  const durationSec = parseDurationSec(process.env.MARKET_DURATION_SECONDS ?? "86400");

  const latestBlock = await ethers.provider.getBlock("latest");
  const deadline = BigInt((latestBlock?.timestamp ?? 0) + durationSec);

  const factory = await ethers.getContractAt("MarketFactory", factoryAddress, sender);
  const tx = await factory.createMarket(question, deadline, metadataURI);
  const receipt = await tx.wait();

  let marketId: bigint | undefined;
  let marketAddress: string | undefined;
  for (const log of receipt?.logs ?? []) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed && parsed.name === "MarketCreated") {
        marketId = parsed.args.marketId as bigint;
        marketAddress = parsed.args.marketAddress as string;
        break;
      }
    } catch {
      // skip unrelated logs
    }
  }

  if (marketId === undefined || marketAddress === undefined) {
    throw new Error("Could not parse MarketCreated event");
  }

  const vaultAddress = await factory.vault();
  const vault = await ethers.getContractAt("MarketVault", vaultAddress, sender);
  await (await vault.setMarketOperator(marketId, marketAddress, true)).wait();

  console.log("Market created");
  console.log("Market ID     :", marketId.toString());
  console.log("Market Address:", marketAddress);
  console.log("Vault Address :", vaultAddress);
  console.log("Operator link : enabled");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
