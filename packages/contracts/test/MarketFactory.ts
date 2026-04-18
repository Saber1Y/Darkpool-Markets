import { expect } from "chai";
import { ethers } from "hardhat";

describe("MarketFactory", function () {
  async function deployFixture() {
    const [owner, creator] = await ethers.getSigners();

    const resolverFactory = await ethers.getContractFactory("MarketResolver");
    const resolver = await resolverFactory.connect(owner).deploy(owner.address);
    await resolver.waitForDeployment();

    const vaultFactory = await ethers.getContractFactory("MarketVault");
    const vault = await vaultFactory.connect(owner).deploy(owner.address, owner.address, 200);
    await vault.waitForDeployment();

    const factoryFactory = await ethers.getContractFactory("MarketFactory");
    const factory = await factoryFactory.connect(owner).deploy(await resolver.getAddress(), await vault.getAddress());
    await factory.waitForDeployment();

    return { owner, creator, resolver, vault, factory };
  }

  it("creates and indexes deployed markets for discovery", async function () {
    const { creator, resolver, vault, factory } = await deployFixture();
    const currentBlock = await ethers.provider.getBlock("latest");
    const deadline = BigInt((currentBlock?.timestamp ?? 0) + 3600);

    const tx = await factory
      .connect(creator)
      .createMarket("Will SOL close above 400?", deadline, "ipfs://sol-market");
    await tx.wait();

    expect(await factory.totalMarkets()).to.eq(1);
    expect(await factory.getMarketsByCreator(creator.address)).to.deep.eq([1n]);

    const market = await factory.getMarket(1);
    expect(market.creator).to.eq(creator.address);
    expect(market.deadline).to.eq(deadline);
    expect(market.marketAddress).to.not.eq(ethers.ZeroAddress);

    const listed = await factory.listMarkets(0, 10);
    expect(listed.length).to.eq(1);
    expect(listed[0].marketAddress).to.eq(market.marketAddress);

    const deployedMarket = await ethers.getContractAt("PredictionMarket", market.marketAddress);
    expect(await deployedMarket.question()).to.eq("Will SOL close above 400?");
    expect(await deployedMarket.creator()).to.eq(creator.address);
    expect(await deployedMarket.resolver()).to.eq(await resolver.getAddress());
    expect(await deployedMarket.vault()).to.eq(await vault.getAddress());
    expect(await deployedMarket.marketId()).to.eq(1);
  });
});
