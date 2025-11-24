import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const StudentRegistry = await ethers.getContractFactory("StudentRegistry");
  const registry = await StudentRegistry.deploy();

  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("StudentRegistry deployed to:", registryAddress);

  // Grant the deployer permission to mutate records immediately after deployment
  const grantTx = await registry.grantTeacher(deployer.address);
  await grantTx.wait();
  console.log("TEACHER_ROLE granted to deployer", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
