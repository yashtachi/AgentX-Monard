const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying AgentX contracts to Monard testnet...");

  // Get the deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy AgentFactory
  console.log("\n📦 Deploying AgentFactory...");
  const AgentFactory = await ethers.getContractFactory("AgentFactory");
  const agentFactory = await AgentFactory.deploy();
  
  await agentFactory.waitForDeployment();
  const factoryAddress = await agentFactory.getAddress();
  
  console.log("✅ AgentFactory deployed to:", factoryAddress);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const agentCount = await agentFactory.getAgentCount();
  console.log("Initial agent count:", agentCount.toString());
  
  // Create a test agent
  console.log("\n🤖 Creating a test agent...");
  const testGoal = "Summarize the latest blockchain news every hour";
  const tx = await agentFactory.createAgent(testGoal);
  await tx.wait();
  
  const userAgents = await agentFactory.getUserAgents(deployer.address);
  console.log("✅ Test agent created at:", userAgents[0]);
  
  console.log("\n📝 Deployment Summary:");
  console.log("======================");
  console.log("AgentFactory:", factoryAddress);
  console.log("Test Agent:", userAgents[0]);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  
  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    agentFactory: factoryAddress,
    testAgent: userAgents[0],
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  const fs = require("fs");
  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
