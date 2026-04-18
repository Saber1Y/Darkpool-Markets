import { expect } from "chai";
import { ethers } from "hardhat";

describe("MarketResolver", function () {
  async function deployFixture() {
    const [owner, creator, delegatedResolver, outsider] = await ethers.getSigners();

    const resolverFactory = await ethers.getContractFactory("MarketResolver");
    const resolver = await resolverFactory.connect(owner).deploy(owner.address);
    await resolver.waitForDeployment();

    const currentBlock = await ethers.provider.getBlock("latest");
    const deadline = BigInt((currentBlock?.timestamp ?? 0) + 60);
    const marketId = 1n;

    const vaultFactory = await ethers.getContractFactory("MarketVault");
    const vault = await vaultFactory.connect(owner).deploy(owner.address, owner.address, 200);
    await vault.waitForDeployment();

    const marketFactory = await ethers.getContractFactory("PredictionMarket");
    const market = await marketFactory
      .connect(creator)
      .deploy(
        "Will BTC close above 120k?",
        "ipfs://btc-market",
        deadline,
        creator.address,
        await resolver.getAddress(),
        await vault.getAddress(),
        marketId
      );
    await market.waitForDeployment();

    return { owner, creator, delegatedResolver, outsider, resolver, market, vault, marketId };
  }

  it("lets approved resolver publish snapshot and resolve after expiry", async function () {
    const { owner, delegatedResolver, resolver, market } = await deployFixture();

    await resolver.connect(owner).setResolver(delegatedResolver.address, true);

    await expect(
      resolver.connect(delegatedResolver).publishSnapshot(await market.getAddress(), 6800, 150, 2, "ipfs://source")
    ).to.not.be.reverted;

    expect(await market.confidenceYesBps()).to.eq(6800);
    expect(await market.signalStrength()).to.eq(2);

    await ethers.provider.send("evm_increaseTime", [120]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      resolver.connect(delegatedResolver).resolveMarket(await market.getAddress(), true, "ipfs://evidence")
    ).to.not.be.reverted;

    expect(await market.status()).to.eq(2); // RESOLVED
    expect(await market.outcomeSet()).to.eq(true);
    expect(await market.resolvedOutcome()).to.eq(true);
  });

  it("rejects non-resolver accounts", async function () {
    const { outsider, resolver, market } = await deployFixture();

    await expect(
      resolver.connect(outsider).resolveMarket(await market.getAddress(), false, "ipfs://nope")
    ).to.be.revertedWithCustomError(resolver, "NotResolver");
  });
});
