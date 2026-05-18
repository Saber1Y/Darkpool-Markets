import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const [deployer] = signers;

  const latestBlock = await ethers.provider.getBlock("latest");
  const now = latestBlock?.timestamp ?? 0;

  // Read deployed addresses from env (set by setup-local.ts)
  const factoryAddress = process.env.FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error("Missing FACTORY_ADDRESS — did you run setup-local.ts first?");
  }

  const factory = await ethers.getContractAt("MarketFactory", factoryAddress, deployer);
  const vaultAddress = await factory.vault();
  const vault = await ethers.getContractAt("MarketVault", vaultAddress, deployer);

  // Market A: short deadline so it can be closed quickly.
  const nearDeadline = BigInt(now + 60); // 1 minute from now
  const tx1 = await factory.createMarket(
    "[TEST] Can I close + resolve immediately?",
    nearDeadline,
    "ipfs://test-expired"
  );
  const r1 = await tx1.wait();

  let expiredId: bigint | undefined;
  let expiredAddr: string | undefined;
  for (const log of r1?.logs ?? []) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === "MarketCreated") {
        expiredId = parsed.args.marketId as bigint;
        expiredAddr = parsed.args.marketAddress as string;
      }
    } catch {}
  }

  if (!expiredId || !expiredAddr) throw new Error("Failed to parse MarketCreated");
  await vault.setMarketOperator(expiredId, expiredAddr, true);

  // Market B: deadline 90 seconds out → gives time to place bet in browser
  const futureDeadline = BigInt(now + 90);
  const tx2 = await factory.createMarket(
    "[TEST] Normal timed market",
    futureDeadline,
    "ipfs://test-future"
  );
  const r2 = await tx2.wait();

  let futureId: bigint | undefined;
  let futureAddr: string | undefined;
  for (const log of r2?.logs ?? []) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === "MarketCreated") {
        futureId = parsed.args.marketId as bigint;
        futureAddr = parsed.args.marketAddress as string;
      }
    } catch {}
  }

  if (!futureId || !futureAddr) throw new Error("Failed to parse MarketCreated");
  await vault.setMarketOperator(futureId, futureAddr, true);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║               TEST MARKETS READY                            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
  ║  Market A (short deadline):                                  ║
║    ID:      ${expiredId.toString().padEnd(35)}║
║    Address: ${expiredAddr!.padEnd(42)}║
  ║    Status:  Active for ~60s — close/resolve after expiry     ║
║                                                              ║
║  Market B (90s deadline):                                    ║
║    ID:      ${futureId.toString().padEnd(35)}║
║    Address: ${futureAddr!.padEnd(42)}║
║    Status:  Active — close after ~90 seconds                 ║
║                                                              ║
║  ─── BROWSER TESTING STEPS ───                               ║
║                                                              ║
║  1. Open http://localhost:3000                               ║
║  2. Connect MetaMask to Hardhat (chain ID 31337)             ║
║  3. Find the [TEST] market you want to test                  ║
║  4. Place a bet (YES or NO, any amount)                      ║
  ║  5. For Market A: wait ~60s, then close & resolve            ║
║     For Market B: wait ~90 seconds, then close & resolve     ║
║  6. After resolving, claim your winnings                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
