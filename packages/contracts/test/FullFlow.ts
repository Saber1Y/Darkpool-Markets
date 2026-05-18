import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("Full Flow: place → increase → close → snapshot → resolve → claim → settle", function () {
  async function deployFixture() {
    const signers = await ethers.getSigners();
    const [owner, alice, resolver, feeRecipient] = signers;
    const bob = signers[4];
    const currentBlock = await ethers.provider.getBlock("latest");
    const deadline = BigInt((currentBlock?.timestamp ?? 0) + 3600);
    const marketId = 1n;

    const vaultFactory = await ethers.getContractFactory("MarketVault");
    const vault = await vaultFactory.connect(owner).deploy(owner.address, feeRecipient.address, 200);
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

    return { owner, alice, bob, resolver, feeRecipient, vault, market, marketAddress: await market.getAddress(), marketId };
  }

  it("full flow: placeBet → increaseBet(with value) → closeMarket → publishSnapshot → resolveMarket → claim → settleClaim", async function () {
    const { owner, alice, bob, resolver, feeRecipient, market, marketAddress, vault, marketId } = await deployFixture();
    await fhevm.assertCoprocessorInitialized(market, "PredictionMarket");

    // ── Step 1: Alice places initial bet ──
    const initialBet = await fhevm.createEncryptedInput(marketAddress, alice.address).addBool(true).encrypt();
    let tx = await market.connect(alice).placeBet(initialBet.handles[0], initialBet.inputProof, {
      value: ethers.parseEther("1")
    });
    await tx.wait();

    let [encSide, encAmount, exists, claimed] = await market.connect(alice).getMyPosition();
    expect(exists).to.eq(true);
    expect(claimed).to.eq(false);
    expect(await fhevm.userDecryptEbool(encSide, marketAddress, alice)).to.eq(true);
    expect(await fhevm.userDecryptEuint(FhevmType.euint32, encAmount, marketAddress, alice)).to.eq(1000n);
    expect(await vault.escrowByMarket(marketId)).to.eq(ethers.parseEther("1"));

    // ── Step 2: Alice increases bet WITH additional ETH (payable increaseBet) ──
    tx = await market.connect(alice).increaseBet({
      value: ethers.parseEther("0.5")
    });
    await tx.wait();

    [encSide, encAmount, exists, claimed] = await market.connect(alice).getMyPosition();
    expect(await fhevm.userDecryptEuint(FhevmType.euint32, encAmount, marketAddress, alice)).to.eq(1500n);
    expect(await vault.escrowByMarket(marketId)).to.eq(ethers.parseEther("1.5"));

    // ── Step 3: Bob places a NO bet ──
    const bobBet = await fhevm.createEncryptedInput(marketAddress, bob.address).addBool(false).encrypt();
    tx = await market.connect(bob).placeBet(bobBet.handles[0], bobBet.inputProof, {
      value: ethers.parseEther("0.5")
    });
    await tx.wait();

    // Verify pools
    tx = await market.connect(owner).grantPoolAccess(alice.address);
    await tx.wait();
    const [encYesPool, encNoPool] = await market.getEncryptedPools();
    expect(await fhevm.userDecryptEuint(FhevmType.euint32, encYesPool, marketAddress, alice)).to.eq(1500n);
    expect(await fhevm.userDecryptEuint(FhevmType.euint32, encNoPool, marketAddress, alice)).to.eq(500n);
    expect(await market.participantCount()).to.eq(2n);
    expect(await vault.escrowByMarket(marketId)).to.eq(ethers.parseEther("2"));

    // ── Step 4: Fast-forward past deadline ──
    await ethers.provider.send("evm_increaseTime", [4000]);
    await ethers.provider.send("evm_mine", []);

    // ── Step 5: Close market (creator only) ──
    expect(await market.status()).to.eq(0);
    tx = await market.connect(owner).closeMarket();
    await tx.wait();
    expect(await market.status()).to.eq(1);

    // ── Step 6: Publish snapshot ──
    tx = await market.connect(resolver).publishSnapshot(7500, 100, 2);
    await tx.wait();
    expect(await market.confidenceYesBps()).to.eq(7500);
    expect(await market.confidenceDeltaBps24h()).to.eq(100);
    expect(await market.signalStrength()).to.eq(2);

    // ── Step 7: Resolve market (YES wins) ──
    tx = await market.connect(resolver).resolveMarket(true);
    await tx.wait();
    expect(await market.status()).to.eq(2);
    expect(await market.outcomeSet()).to.eq(true);
    expect(await market.resolvedOutcome()).to.eq(true);

    // ── Step 8: Alice claims ──
    tx = await market.connect(alice).claim();
    await tx.wait();
    [encSide, encAmount, exists, claimed] = await market.connect(alice).getMyPosition();
    expect(claimed).to.eq(true);

    // ── Step 9: Settle Alice's claim ──
    const aliceBefore = await ethers.provider.getBalance(alice.address);
    const feeBefore = await ethers.provider.getBalance(feeRecipient.address);

    tx = await market.connect(resolver).settleClaim(alice.address, true);
    await tx.wait();

    const aliceAfter = await ethers.provider.getBalance(alice.address);
    const feeAfter = await ethers.provider.getBalance(feeRecipient.address);

    expect(await market.claimSettled(alice.address)).to.eq(true);
    expect(aliceAfter - aliceBefore).to.eq(ethers.parseEther("1.47"));
    expect(feeAfter - feeBefore).to.eq(ethers.parseEther("0.03"));

    // ── Step 10: Bob claims (loser) ──
    tx = await market.connect(bob).claim();
    await tx.wait();

    const bobBefore = await ethers.provider.getBalance(bob.address);
    tx = await market.connect(resolver).settleClaim(bob.address, false);
    await tx.wait();
    expect(await market.claimSettled(bob.address)).to.eq(true);
    expect(await ethers.provider.getBalance(bob.address) - bobBefore).to.eq(0n);

    // ── Step 11: Remaining escrow ──
    expect(await vault.escrowByMarket(marketId)).to.eq(ethers.parseEther("0.5"));
  });

  it("cannot close market before deadline", async function () {
    const { owner, market } = await deployFixture();
    await expect(
      market.connect(owner).closeMarket()
    ).to.be.revertedWithCustomError(market, "MarketStillActive");
  });

  it("cannot place bet after market resolved", async function () {
    const { alice, resolver, market, marketAddress } = await deployFixture();
    await ethers.provider.send("evm_increaseTime", [4000]);
    await ethers.provider.send("evm_mine", []);
    await market.connect(resolver).resolveMarket(true);

    const bet = await fhevm.createEncryptedInput(marketAddress, alice.address).addBool(true).encrypt();
    await expect(
      market.connect(alice).placeBet(bet.handles[0], bet.inputProof, { value: ethers.parseEther("0.001") })
    ).to.be.revertedWithCustomError(market, "InvalidStatus");
  });

  it("only creator can close market", async function () {
    const { alice, market } = await deployFixture();
    await ethers.provider.send("evm_increaseTime", [4000]);
    await ethers.provider.send("evm_mine", []);
    await expect(
      market.connect(alice).closeMarket()
    ).to.be.revertedWithCustomError(market, "NotCreator");
  });

  it("only resolver or creator can resolve", async function () {
    const { alice, market } = await deployFixture();
    await ethers.provider.send("evm_increaseTime", [4000]);
    await ethers.provider.send("evm_mine", []);
    await expect(
      market.connect(alice).resolveMarket(true)
    ).to.be.revertedWithCustomError(market, "NotResolverOrCreator");
  });

  it("cannot claim twice", async function () {
    const { alice, resolver, market, marketAddress } = await deployFixture();

    const bet = await fhevm.createEncryptedInput(marketAddress, alice.address).addBool(true).encrypt();
    let tx = await market.connect(alice).placeBet(bet.handles[0], bet.inputProof, {
      value: ethers.parseEther("0.1")
    });
    await tx.wait();

    await ethers.provider.send("evm_increaseTime", [4000]);
    await ethers.provider.send("evm_mine", []);
    await market.connect(resolver).resolveMarket(true);

    await market.connect(alice).claim();
    await expect(
      market.connect(alice).claim()
    ).to.be.revertedWithCustomError(market, "AlreadyClaimed");
  });

  it("creator can cancel active market", async function () {
    const { owner, market } = await deployFixture();
    expect(await market.status()).to.eq(0);
    await market.connect(owner).cancelMarket();
    expect(await market.status()).to.eq(3);
  });

  it("non-creator cannot cancel", async function () {
    const { alice, market } = await deployFixture();
    await expect(
      market.connect(alice).cancelMarket()
    ).to.be.revertedWithCustomError(market, "NotCreator");
  });
});
