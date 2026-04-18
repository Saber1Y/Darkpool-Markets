import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("PredictionMarket", function () {
  async function deployFixture() {
    const [creator, alice, resolver] = await ethers.getSigners();
    const currentBlock = await ethers.provider.getBlock("latest");
    const deadline = BigInt((currentBlock?.timestamp ?? 0) + 3600);

    const contractFactory = await ethers.getContractFactory("PredictionMarket");
    const contract = await contractFactory
      .connect(creator)
      .deploy("Will ETH close above 5k?", "ipfs://market-meta", deadline, creator.address, resolver.address);
    await contract.waitForDeployment();

    return {
      creator,
      alice,
      resolver,
      contract,
      contractAddress: await contract.getAddress()
    };
  }

  it("stores encrypted bets and updates encrypted pools", async function () {
    const { creator, alice, contract, contractAddress } = await deployFixture();
    await fhevm.assertCoprocessorInitialized(contract, "PredictionMarket");

    // Alice places initial bet: YES with 25 units.
    const initialBet = await fhevm.createEncryptedInput(contractAddress, alice.address).addBool(true).add32(25).encrypt();
    let tx = await contract.connect(alice).placeBet(initialBet.handles[0], initialBet.handles[1], initialBet.inputProof);
    await tx.wait();

    const [encSide, encAmount, exists, claimed] = await contract.connect(alice).getMyPosition();
    const clearSide = await fhevm.userDecryptEbool(encSide, contractAddress, alice);
    const clearAmount = await fhevm.userDecryptEuint(FhevmType.euint32, encAmount, contractAddress, alice);

    expect(exists).to.eq(true);
    expect(claimed).to.eq(false);
    expect(clearSide).to.eq(true);
    expect(clearAmount).to.eq(25n);

    // Alice increases the same bet by 5 units.
    const topUpBet = await fhevm.createEncryptedInput(contractAddress, alice.address).add32(5).encrypt();
    tx = await contract.connect(alice).increaseBet(topUpBet.handles[0], topUpBet.inputProof);
    await tx.wait();

    tx = await contract.connect(creator).grantPoolAccess(alice.address);
    await tx.wait();

    const [encYesPool, encNoPool] = await contract.getEncryptedPools();
    const clearYesPool = await fhevm.userDecryptEuint(FhevmType.euint32, encYesPool, contractAddress, alice);
    const clearNoPool = await fhevm.userDecryptEuint(FhevmType.euint32, encNoPool, contractAddress, alice);

    expect(clearYesPool).to.eq(30n);
    expect(clearNoPool).to.eq(0n);
  });
});
