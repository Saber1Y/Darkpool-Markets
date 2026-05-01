import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const TEST_MARKETS = [
  { question: "Will ETH close above $5,000 in 2026?", durationDays: 180 },
  { question: "Will Bitcoin reach $100k before July 2026?", durationDays: 60 },
  { question: "Will DarkPool Markets have 1,000 users by end of 2026?", durationDays: 365 },
  { question: "Will the Fed cut rates by 0.5% in Q2 2026?", durationDays: 90 }
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting up local environment with account:", deployer.address);

  // Deploy MarketResolver
  console.log("\nDeploying MarketResolver...");
  const resolverFactory = await ethers.getContractFactory("MarketResolver");
  const resolver = await resolverFactory.connect(deployer).deploy(deployer.address);
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();
  console.log("MarketResolver deployed to:", resolverAddress);

  // Deploy MarketVault
  console.log("\nDeploying MarketVault...");
  const vaultFactory = await ethers.getContractFactory("MarketVault");
  const vault = await vaultFactory.connect(deployer).deploy(deployer.address, deployer.address, 200);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("MarketVault deployed to:", vaultAddress);

  // Deploy MarketFactory (needs resolver and vault addresses)
  console.log("\nDeploying MarketFactory...");
  const factoryFactory = await ethers.getContractFactory("MarketFactory");
  const factory = await factoryFactory.connect(deployer).deploy(resolverAddress, vaultAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("MarketFactory deployed to:", factoryAddress);

  // Create test markets
  console.log("\nCreating test markets...");
  const latestBlock = await ethers.provider.getBlock("latest");
  const currentTime = BigInt(latestBlock?.timestamp ?? 0);

  for (const [index, marketData] of TEST_MARKETS.entries()) {
    const deadline = currentTime + BigInt(marketData.durationDays * 86400);
    const tx = await factory.createMarket(marketData.question, deadline, `ipfs://market-${index}`);
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
        // skip
      }
    }

    if (marketId !== undefined && marketAddress !== undefined) {
      await (await vault.setMarketOperator(marketId, marketAddress, true)).wait();
      console.log(`  Market #${marketId}: ${marketData.question}`);
    }
  }

  // Update .env.local
  const envPath = path.resolve(__dirname, "../../../apps/web/.env.local");
  let envContent = "";
  try {
    envContent = fs.readFileSync(envPath, "utf-8");
  } catch {
    // file doesn't exist
  }

  if (envContent.includes("NEXT_PUBLIC_FACTORY_ADDRESS")) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_FACTORY_ADDRESS=.*/,
      `NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`
    );
  } else {
    envContent += `\nNEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}\n`;
  }

  // Also update RPC URL if needed
  if (!envContent.includes("NEXT_PUBLIC_RPC_URL")) {
    envContent += `NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545\n`;
  }

  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("\nUpdated apps/web/.env.local with factory address");

  console.log("\n=== Setup Complete! ===");
  console.log("Factory Address:", factoryAddress);
  console.log("Resolver Address:", resolverAddress);
  console.log("Vault Address:", vaultAddress);
  console.log("\nNow run: pnpm dev:web");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
