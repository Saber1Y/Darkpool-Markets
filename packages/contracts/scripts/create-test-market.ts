import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const [deployer] = signers;

  const latestBlock = await ethers.provider.getBlock("latest");
  const now = latestBlock?.timestamp ?? 0;

  const factoryAddress = process.env.FACTORY_ADDRESS;
  if (!factoryAddress) throw new Error("Missing FACTORY_ADDRESS");

  const factory = await ethers.getContractAt("MarketFactory", factoryAddress, deployer);
  const vaultAddress = await factory.vault();
  const vault = await ethers.getContractAt("MarketVault", vaultAddress, deployer);

  const deadline = BigInt(now + 300); // 5 minutes from now
  const tx = await factory.createMarket(
    "[TEST] Will YES win this market?",
    deadline,
    "ipfs://test-flow"
  );
  const r = await tx.wait();

  let marketId: bigint | undefined;
  let marketAddr: string | undefined;
  for (const log of r?.logs ?? []) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === "MarketCreated") {
        marketId = parsed.args.marketId as bigint;
        marketAddr = parsed.args.marketAddress as string;
      }
    } catch {}
  }

  if (!marketId || !marketAddr) throw new Error("Failed to parse MarketCreated");
  await vault.setMarketOperator(marketId, marketAddr, true);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║               TEST MARKET READY                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Market ID:      ${marketId.toString().padEnd(35)}║
║  Address:        ${marketAddr!.padEnd(42)}║
║  Deadline:       5 minutes from now                          ║
║                                                              ║
║  ─── BROWSER TESTING STEPS ───                               ║
║                                                              ║
║  1. Open http://localhost:3000                               ║
║  2. Connect MetaMask to localhost:8545 (chain ID 31337)      ║
║  3. Find the [TEST] market and place a bet                  ║
║  4. After betting, advance Hardhat time:                     ║
║                                                              ║
║     curl http://127.0.0.1:8545 -H "Content-Type:             ║
║       application/json" -d '{"jsonrpc":"2.0","id":1,         ║
║       "method":"evm_increaseTime",                           ║
║       "params":[400]}'                                       ║
║                                                              ║
║     curl http://127.0.0.1:8545 -H "Content-Type:             ║
║       application/json" -d '{"jsonrpc":"2.0","id":1,         ║
║       "method":"evm_mine",[]}'                                ║
║                                                              ║
║  5. Refresh browser — UI will auto-detect new status        ║
║  6. Close Market button appears — click it                  ║
║  7. Publish Snapshot (optional, fill in values)              ║
║  8. Resolve Market — pick YES or NO, click resolve          ║
║  9. Claim Payout section appears — claim your winnings      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
