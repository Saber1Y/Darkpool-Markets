import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("PredictionMarket", function () {
  async function deployFixture() {
    const [owner, alice, resolver, feeRecipient] = await ethers.getSigners();
    const currentBlock = await ethers.provider.getBlock("latest");
    const deadline = BigInt((currentBlock?.timestamp ?? 0) + 3600);
    const marketId = 1n;

    const vaultFactory = await ethers.getContractFactory("MarketVault");
    const vault = await vaultFactory.connect(owner).deploy(owner.address, feeRecipient.address, 200); // 2%
    await vault.waitForDeployment();

    const marketFactory = await ethers.getContractFactory("PredictionMarket");
    const market = await marketFactory
      .connect(owner)
      .deploy(
        "Will ETH close above 5k?",
        "ipfs://market-meta",
        deadline,
        owner.address,
        resolver.address,
        await vault.getAddress(),
        marketId
      );
    await market.waitForDeployment();

    await vault.connect(owner).setMarketOperator(marketId, await market.getAddress(), true);

    return {
      owner,
      alice,
      resolver,
      feeRecipient,
      vault,
      market,
      marketAddress: await market.getAddress(),
      marketId
    };
  }

  it("stores encrypted bets, updates encrypted pools, and escrows stake", async function () {
    const { owner, alice, market, marketAddress, vault, marketId } = await deployFixture();
    await fhevm.assertCoprocessorInitialized(market, "PredictionMarket");

    // Alice places initial bet: YES with 25 encrypted units + 1 ETH stake escrow.
    const initialBet = await fhevm.createEncryptedInput(marketAddress, alice.address).addBool(true).add32(25).encrypt();
    let tx = await market.connect(alice).placeBet(initialBet.handles[0], initialBet.handles[1], initialBet.inputProof, {
      value: ethers.parseEther("1")
    });
    await tx.wait();

    expect(await vault.escrowByMarket(marketId)).to.eq(ethers.parseEther("1"));

    const [encSide, encAmount, exists, claimed] = await market.connect(alice).getMyPosition();
    const clearSide = await fhevm.userDecryptEbool(encSide, marketAddress, alice);
    const clearAmount = await fhevm.userDecryptEuint(FhevmType.euint32, encAmount, marketAddress, alice);

    expect(exists).to.eq(true);
    expect(claimed).to.eq(false);
    expect(clearSide).to.eq(true);
    expect(clearAmount).to.eq(25n);

    // Alice increases the same bet by 5 encrypted units.
    const topUpBet = await fhevm.createEncryptedInput(marketAddress, alice.address).add32(5).encrypt();
    tx = await market.connect(alice).increaseBet(topUpBet.handles[0], topUpBet.inputProof);
    await tx.wait();

    tx = await market.connect(owner).grantPoolAccess(alice.address);
    await tx.wait();

    const [encYesPool, encNoPool] = await market.getEncryptedPools();
    const clearYesPool = await fhevm.userDecryptEuint(FhevmType.euint32, encYesPool, marketAddress, alice);
    const clearNoPool = await fhevm.userDecryptEuint(FhevmType.euint32, encNoPool, marketAddress, alice);

    expect(clearYesPool).to.eq(30n);
    expect(clearNoPool).to.eq(0n);
  });

  it("settles a winner claim through MarketVault", async function () {
    const { alice, resolver, feeRecipient, market, marketAddress, vault, marketId } = await deployFixture();

    const bet = await fhevm.createEncryptedInput(marketAddress, alice.address).addBool(true).add32(100).encrypt();
    let tx = await market.connect(alice).placeBet(bet.handles[0], bet.handles[1], bet.inputProof, {
      value: ethers.parseEther("1")
    });
    await tx.wait();

    await ethers.provider.send("evm_increaseTime", [4000]);
    await ethers.provider.send("evm_mine", []);

    tx = await market.connect(resolver).resolveMarket(true);
    await tx.wait();

    tx = await market.connect(alice).claim();
    await tx.wait();

    const aliceBefore = await ethers.provider.getBalance(alice.address);
    const feeBefore = await ethers.provider.getBalance(feeRecipient.address);

    tx = await market.connect(resolver).settleClaim(alice.address, true, ethers.parseEther("0.5"));
    await tx.wait();

    const aliceAfter = await ethers.provider.getBalance(alice.address);
    const feeAfter = await ethers.provider.getBalance(feeRecipient.address);

    expect(await market.claimSettled(alice.address)).to.eq(true);
    expect(await vault.escrowByMarket(marketId)).to.eq(ethers.parseEther("0.5"));
    expect(aliceAfter - aliceBefore).to.eq(ethers.parseEther("0.49"));
    expect(feeAfter - feeBefore).to.eq(ethers.parseEther("0.01"));
  });
});
