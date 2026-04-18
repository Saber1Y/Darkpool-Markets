import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("FHECounterTraining", function () {
  async function deployFixture() {
    const [deployer, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("FHECounterTraining");
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    return {
      deployer,
      alice,
      contract,
      contractAddress: await contract.getAddress()
    };
  }

  it("increments with encrypted input and decrypts result for caller", async function () {
    const { contract, contractAddress, alice } = await deployFixture();
    await fhevm.assertCoprocessorInitialized(contract, "FHECounterTraining");

    const encrypted = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(7)
      .encrypt();

    const tx = await contract.connect(alice).increment(encrypted.handles[0], encrypted.inputProof);
    await tx.wait();

    const encryptedCount = await contract.getCount();
    const clearCount = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedCount, contractAddress, alice);

    expect(clearCount).to.eq(7);
  });
});
