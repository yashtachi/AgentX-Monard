const { ethers } = require("ethers");
const OpenAI = require("openai");
const cron = require("cron");
const fs = require("fs");
require("dotenv").config();

// Import contract ABIs
const AgentFactoryABI = require("../artifacts/contracts/AgentFactory.sol/AgentFactory.json").abi;
const AgentABI = require("../artifacts/contracts/Agent.sol/Agent.json").abi;

class AgentExecutor {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.agentFactory = null;
    this.openai = null;
    this.isRunning = false;
    this.executionInterval = 60000; // 1 minute default
    
    this.init();
  }
  
  async init() {
    try {
      console.log("🚀 Initializing AgentX Executor...");
      
      // Initialize blockchain connection
      await this.initBlockchain();
      
      // Initialize OpenAI
      await this.initOpenAI();
      
      // Load deployment info
      await this.loadDeploymentInfo();
      
      console.log("✅ Executor initialized successfully!");
      
      // Start the execution loop
      this.startExecutionLoop();
      
    } catch (error) {
      console.error("❌ Failed to initialize executor:", error);
      process.exit(1);
    }
  }
  
  async initBlockchain() {
    const rpcUrl = process.env.MONARD_RPC_URL || "https://rpc.monard.network";
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error("PRIVATE_KEY environment variable not set");
    }
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    const balance = await this.provider.getBalance(this.wallet.address);
    console.log(`💰 Executor wallet: ${this.wallet.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  }
  
  async initOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set");
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey
    });
    
    console.log("🤖 OpenAI initialized");
  }
  
  async loadDeploymentInfo() {
    try {
      const deploymentData = fs.readFileSync("deployment.json", "utf8");
      const deployment = JSON.parse(deploymentData);
      
      this.agentFactory = new ethers.Contract(
        deployment.agentFactory,
        AgentFactoryABI,
        this.wallet
      );
      
      console.log(`📋 Loaded AgentFactory at: ${deployment.agentFactory}`);
    } catch (error) {
      console.error("❌ Failed to load deployment info. Run deployment first.");
      throw error;
    }
  }
  
  startExecutionLoop() {
    console.log("🔄 Starting execution loop...");
    this.isRunning = true;
    
    // Run immediately
    this.executeAgents();
    
    // Schedule periodic execution
    const job = new cron.CronJob('0 * * * * *', () => { // Every minute
      this.executeAgents();
    });
    
    job.start();
    console.log("⏰ Scheduled execution every minute");
  }
  
  async executeAgents() {
    try {
      console.log("\n🔍 Checking for agents to execute...");
      
      const agentCount = await this.agentFactory.getAgentCount();
      console.log(`📊 Total agents: ${agentCount}`);
      
      if (agentCount == 0) {
        console.log("📭 No agents found");
        return;
      }
      
      // Get all agents (paginated for large numbers)
      const agents = await this.agentFactory.getAgents(0, Math.min(agentCount, 100));
      
      for (const agentAddress of agents) {
        await this.executeAgent(agentAddress);
      }
      
    } catch (error) {
      console.error("❌ Error in execution loop:", error);
    }
  }
  
  async executeAgent(agentAddress) {
    try {
      const agent = new ethers.Contract(agentAddress, AgentABI, this.wallet);
      
      // Get agent info
      const agentInfo = await agent.getAgentInfo();
      const [owner, goal, lastResponse, lastExecution, execCount, isActive, memoryCount] = agentInfo;
      
      if (!isActive) {
        console.log(`⏸️  Agent ${agentAddress} is inactive`);
        return;
      }
      
      console.log(`\n🤖 Executing agent: ${agentAddress}`);
      console.log(`🎯 Goal: ${goal}`);
      console.log(`📊 Execution count: ${execCount}`);
      
      // Check if enough time has passed (e.g., 1 hour = 3600 seconds)
      const currentTime = Math.floor(Date.now() / 1000);
      const timeSinceLastExecution = currentTime - Number(lastExecution);
      const minInterval = 3600; // 1 hour
      
      if (timeSinceLastExecution < minInterval && Number(execCount) > 0) {
        console.log(`⏳ Agent executed ${timeSinceLastExecution}s ago, waiting...`);
        return;
      }
      
      // Get agent memories for context
      const memories = await agent.getAllMemories();
      let memoryContext = "";
      
      if (memories.length > 0) {
        memoryContext = "\n\nPrevious memories:\n";
        memories.slice(-5).forEach((memory, index) => { // Last 5 memories
          memoryContext += `${memory.key}: ${memory.value}\n`;
        });
      }
      
      // Create prompt for OpenAI
      const prompt = `You are an autonomous AI agent deployed on the blockchain. Your goal is: "${goal}"
      
Previous response: ${lastResponse || "None"}
Execution count: ${execCount}
${memoryContext}

Please provide a response that helps achieve your goal. Be concise and actionable. If this is a recurring task, provide an update or summary.`;

      console.log("🧠 Querying OpenAI...");
      
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an autonomous blockchain AI agent. Provide helpful, concise responses that help achieve the given goal."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });
      
      const response = completion.choices[0].message.content;
      console.log(`📝 AI Response: ${response.substring(0, 100)}...`);
      
      // Store response on-chain
      console.log("💾 Storing response on-chain...");
      const tx = await agent.storeResponse(response);
      await tx.wait();
      
      // Store execution timestamp as memory
      await agent.storeMemory(
        `execution_${execCount}`, 
        `${new Date().toISOString()}: ${response.substring(0, 200)}`
      );
      
      console.log("✅ Agent execution completed successfully!");
      
    } catch (error) {
      console.error(`❌ Error executing agent ${agentAddress}:`, error);
    }
  }
  
  async stop() {
    this.isRunning = false;
    console.log("🛑 Executor stopped");
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the executor
if (require.main === module) {
  const executor = new AgentExecutor();
}

module.exports = AgentExecutor;
