const { ethers } = require("ethers");
require("dotenv").config();

// Import contract ABIs
const AgentFactoryABI = require("../artifacts/contracts/AgentFactory.sol/AgentFactory.json").abi;
const AgentABI = require("../artifacts/contracts/Agent.sol/Agent.json").abi;

class AgentXUtils {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.agentFactory = null;
    this.deploymentInfo = null;
    
    this.init();
  }
  
  async init() {
    const rpcUrl = process.env.MONARD_RPC_URL || "https://rpc.monard.network";
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error("PRIVATE_KEY environment variable not set");
    }
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Load deployment info
    try {
      const fs = require("fs");
      const deploymentData = fs.readFileSync("deployment.json", "utf8");
      this.deploymentInfo = JSON.parse(deploymentData);
      
      this.agentFactory = new ethers.Contract(
        this.deploymentInfo.agentFactory,
        AgentFactoryABI,
        this.wallet
      );
    } catch (error) {
      console.warn("⚠️  Deployment info not found. Deploy contracts first.");
    }
  }
  
  // Create a new agent
  async createAgent(goal) {
    if (!this.agentFactory) {
      throw new Error("AgentFactory not initialized. Deploy contracts first.");
    }
    
    console.log(`🤖 Creating new agent with goal: "${goal}"`);
    
    const tx = await this.agentFactory.createAgent(goal);
    const receipt = await tx.wait();
    
    // Find the agent created event
    const event = receipt.logs.find(log => {
      try {
        const parsed = this.agentFactory.interface.parseLog(log);
        return parsed.name === "AgentCreated";
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = this.agentFactory.interface.parseLog(event);
      const agentAddress = parsed.args.agent;
      
      console.log(`✅ Agent created at: ${agentAddress}`);
      console.log(`📊 Transaction hash: ${tx.hash}`);
      
      return agentAddress;
    }
    
    throw new Error("Failed to create agent");
  }
  
  // Get agent instance
  getAgentContract(agentAddress) {
    return new ethers.Contract(agentAddress, AgentABI, this.wallet);
  }
  
  // Get user's agents
  async getUserAgents(userAddress = null) {
    if (!this.agentFactory) {
      throw new Error("AgentFactory not initialized");
    }
    
    const address = userAddress || this.wallet.address;
    const agents = await this.agentFactory.getUserAgents(address);
    
    console.log(`📋 Found ${agents.length} agents for ${address}`);
    
    return agents;
  }
  
  // Get all agents (paginated)
  async getAllAgents(offset = 0, limit = 100) {
    if (!this.agentFactory) {
      throw new Error("AgentFactory not initialized");
    }
    
    const totalCount = await this.agentFactory.getAgentCount();
    const agents = await this.agentFactory.getAgents(offset, limit);
    
    console.log(`📊 Retrieved ${agents.length} agents (${offset}-${offset + agents.length} of ${totalCount})`);
    
    return {
      agents,
      totalCount: Number(totalCount),
      hasMore: (offset + agents.length) < Number(totalCount)
    };
  }
  
  // Get agent details
  async getAgentInfo(agentAddress) {
    const agent = this.getAgentContract(agentAddress);
    const agentInfo = await agent.getAgentInfo();
    const memories = await agent.getAllMemories();
    
    const [owner, goal, lastResponse, lastExecution, execCount, isActive, memoryCount] = agentInfo;
    
    return {
      address: agentAddress,
      owner,
      goal,
      lastResponse,
      lastExecution: Number(lastExecution),
      executionCount: Number(execCount),
      isActive,
      memoryCount: Number(memoryCount),
      memories: memories.map(memory => ({
        key: memory.key,
        value: memory.value,
        timestamp: Number(memory.timestamp)
      }))
    };
  }
  
  // Update agent goal
  async updateAgentGoal(agentAddress, newGoal) {
    const agent = this.getAgentContract(agentAddress);
    
    console.log(`🎯 Updating agent goal to: "${newGoal}"`);
    
    const tx = await agent.updateGoal(newGoal);
    await tx.wait();
    
    console.log(`✅ Goal updated successfully`);
    console.log(`📊 Transaction hash: ${tx.hash}`);
  }
  
  // Store agent memory
  async storeAgentMemory(agentAddress, key, value) {
    const agent = this.getAgentContract(agentAddress);
    
    console.log(`💾 Storing memory: ${key} = ${value}`);
    
    const tx = await agent.storeMemory(key, value);
    await tx.wait();
    
    console.log(`✅ Memory stored successfully`);
    console.log(`📊 Transaction hash: ${tx.hash}`);
  }
  
  // Store agent response (for executor)
  async storeAgentResponse(agentAddress, response) {
    const agent = this.getAgentContract(agentAddress);
    
    console.log(`📝 Storing response for agent ${agentAddress}`);
    
    const tx = await agent.storeResponse(response);
    await tx.wait();
    
    console.log(`✅ Response stored successfully`);
    console.log(`📊 Transaction hash: ${tx.hash}`);
  }
  
  // Activate/deactivate agent
  async setAgentActive(agentAddress, isActive) {
    const agent = this.getAgentContract(agentAddress);
    
    console.log(`${isActive ? '▶️' : '⏸️'} ${isActive ? 'Activating' : 'Deactivating'} agent`);
    
    const tx = await agent.setActive(isActive);
    await tx.wait();
    
    console.log(`✅ Agent ${isActive ? 'activated' : 'deactivated'} successfully`);
    console.log(`📊 Transaction hash: ${tx.hash}`);
  }
  
  // Get network info
  async getNetworkInfo() {
    const network = await this.provider.getNetwork();
    const balance = await this.provider.getBalance(this.wallet.address);
    
    return {
      network: network.name,
      chainId: Number(network.chainId),
      walletAddress: this.wallet.address,
      balance: ethers.formatEther(balance),
      factoryAddress: this.deploymentInfo?.agentFactory || "Not deployed"
    };
  }
}

module.exports = AgentXUtils;
