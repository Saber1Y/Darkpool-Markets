import { expect } from "chai";
import { ethers } from "hardhat";

describe("MarketVault", function () {
  async function deployFixture() {
    const [owner, feeRecipient, alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("MarketVault");
    const contract = await factory.connect(owner).deploy(owner.address, feeRecipient.address, 200); // 2%
    await contract.waitForDeployment();

    return { contract, owner, feeRecipient, alice, bob };
  }

  it("accepts escrow deposits and pays recipient minus fee", async function () {
    const { contract, owner, feeRecipient, alice, bob } = await deployFixture();
    const marketId = 1n;

    await contract.connect(alice).deposit(marketId, { value: ethers.parseEther("1") });
    expect(await contract.escrowByMarket(marketId)).to.eq(ethers.parseEther("1"));

    const bobBefore = await ethers.provider.getBalance(bob.address);
    const feeBefore = await ethers.provider.getBalance(feeRecipient.address);

    await contract.connect(owner).disbursePayout(marketId, bob.address, ethers.parseEther("0.5"));

    const bobAfter = await ethers.provider.getBalance(bob.address);
    const feeAfter = await ethers.provider.getBalance(feeRecipient.address);
    expect(bobAfter - bobBefore).to.eq(ethers.parseEther("0.49"));
    expect(feeAfter - feeBefore).to.eq(ethers.parseEther("0.01"));
    expect(await contract.escrowByMarket(marketId)).to.eq(ethers.parseEther("0.5"));
  });

  it("rejects payout when caller is not owner", async function () {
    const { contract, alice, bob } = await deployFixture();
    await expect(
      contract.connect(alice).disbursePayout(1, bob.address, ethers.parseEther("0.1"))
    ).to.be.revertedWithCustomError(contract, "OnlyOwner");
  });

  it("allows authorized market operator to disburse payout", async function () {
    const { contract, owner, alice, bob } = await deployFixture();
    const marketId = 7n;

    await contract.connect(alice).deposit(marketId, { value: ethers.parseEther("1") });
    await contract.connect(owner).setMarketOperator(marketId, owner.address, true);

    await expect(
      contract.connect(owner).disbursePayoutFromMarket(marketId, bob.address, ethers.parseEther("0.2"))
    ).to.not.be.reverted;
  });
});
