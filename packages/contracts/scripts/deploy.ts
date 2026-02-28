import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MON");

  // 1. Deploy SoulProfile
  const SoulProfile = await ethers.getContractFactory("SoulProfile");
  const soulProfile = await SoulProfile.deploy();
  await soulProfile.waitForDeployment();
  const soulProfileAddr = await soulProfile.getAddress();
  console.log("SoulProfile deployed to:", soulProfileAddr);

  // 2. Deploy MatchRegistry
  const MatchRegistry = await ethers.getContractFactory("MatchRegistry");
  const matchRegistry = await MatchRegistry.deploy(soulProfileAddr, deployer.address);
  await matchRegistry.waitForDeployment();
  const matchRegistryAddr = await matchRegistry.getAddress();
  console.log("MatchRegistry deployed to:", matchRegistryAddr);

  // 3. Transfer SoulProfile ownership to MatchRegistry
  // so MatchRegistry can increment match/conversation counts
  await soulProfile.transferOwnership(matchRegistryAddr);
  console.log("SoulProfile ownership transferred to MatchRegistry");

  console.log("\n=== Deployment Complete ===");
  console.log("SoulProfile:", soulProfileAddr);
  console.log("MatchRegistry:", matchRegistryAddr);
  console.log("\nUpdate packages/shared/src/constants.ts with these addresses!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
