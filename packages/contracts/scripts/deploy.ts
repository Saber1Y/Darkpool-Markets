import { ethers } from "hardhat";

function parseFeeBps(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10_000) {
    throw new Error(`Invalid PLATFORM_FEE_BPS: ${value}`);
  }
  return parsed;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const feeRecipient = process.env.FEE_RECIPIENT ?? deployer.address;
  const feeBps = parseFeeBps(process.env.PLATFORM_FEE_BPS ?? "200");
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contracts on chainId:", network.chainId.toString());
  console.log("Deploying contracts with:", deployer.address);
  console.log("Fee recipient:", feeRecipient, "Fee bps:", feeBps);

  const resolverFactory = await ethers.getContractFactory("MarketResolver");
  const resolver = await resolverFactory.connect(deployer).deploy(deployer.address);
  await resolver.waitForDeployment();

  const vaultFactory = await ethers.getContractFactory("MarketVault");
  const vault = await vaultFactory.connect(deployer).deploy(deployer.address, feeRecipient, feeBps);
  await vault.waitForDeployment();

  const marketFactoryFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await marketFactoryFactory
    .connect(deployer)
    .deploy(await resolver.getAddress(), await vault.getAddress());
  await marketFactory.waitForDeployment();

  console.log("\nDeployment complete:");
  const resolverAddress = await resolver.getAddress();
  const vaultAddress = await vault.getAddress();
  const factoryAddress = await marketFactory.getAddress();
  console.log("MarketResolver:", resolverAddress);
  console.log("MarketVault   :", vaultAddress);
  console.log("MarketFactory :", factoryAddress);

  console.log("\nEnv helpers:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`FACTORY_ADDRESS=${factoryAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
