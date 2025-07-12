#!/usr/bin/env node

const AgentXUtils = require("../utils/AgentXUtils");
const readline = require("readline");

class AgentXCLI {
  constructor() {
    this.utils = new AgentXUtils();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  async start() {
    console.log("🧠 Welcome to AgentX CLI!");
    console.log("========================");
    
    try {
      const networkInfo = await this.utils.getNetworkInfo();
      console.log(`🌐 Network: ${networkInfo.network} (Chain ID: ${networkInfo.chainId})`);
      console.log(`💰 Wallet: ${networkInfo.walletAddress}`);
      console.log(`💰 Balance: ${networkInfo.balance} ETH`);
      console.log(`🏭 Factory: ${networkInfo.factoryAddress}`);
      console.log();
      
      await this.showMenu();
    } catch (error) {
      console.error("❌ Failed to initialize:", error.message);
      process.exit(1);
    }
  }
  
  async showMenu() {
    console.log("Available commands:");
    console.log("1. Create new agent");
    console.log("2. List my agents");
    console.log("3. List all agents");
    console.log("4. View agent details");
    console.log("5. Update agent goal");
    console.log("6. Store agent memory");
    console.log("7. Activate/Deactivate agent");
    console.log("8. Exit");
    console.log();
    
    const choice = await this.askQuestion("Enter your choice (1-8): ");
    
    try {
      switch (choice.trim()) {
        case "1":
          await this.createAgent();
          break;
        case "2":
          await this.listMyAgents();
          break;
        case "3":
          await this.listAllAgents();
          break;
        case "4":
          await this.viewAgentDetails();
          break;
        case "5":
          await this.updateAgentGoal();
          break;
        case "6":
          await this.storeAgentMemory();
          break;
        case "7":
          await this.toggleAgentActive();
          break;
        case "8":
          console.log("👋 Goodbye!");
          this.rl.close();
          return;
        default:
          console.log("❌ Invalid choice. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
    
    console.log();
    await this.showMenu();
  }
  
  async createAgent() {
    const goal = await this.askQuestion("Enter the agent's goal: ");
    
    if (!goal.trim()) {
      console.log("❌ Goal cannot be empty");
      return;
    }
    
    const agentAddress = await this.utils.createAgent(goal);
    console.log(`🎉 Agent created successfully at: ${agentAddress}`);
  }
  
  async listMyAgents() {
    const agents = await this.utils.getUserAgents();
    
    if (agents.length === 0) {
      console.log("📭 You have no agents yet");
      return;
    }
    
    console.log("Your agents:");
    for (let i = 0; i < agents.length; i++) {
      const agentInfo = await this.utils.getAgentInfo(agents[i]);
      console.log(`${i + 1}. ${agents[i]}`);
      console.log(`   Goal: ${agentInfo.goal}`);
      console.log(`   Active: ${agentInfo.isActive ? '✅' : '❌'}`);
      console.log(`   Executions: ${agentInfo.executionCount}`);
      console.log();
    }
  }
  
  async listAllAgents() {
    const result = await this.utils.getAllAgents(0, 10);
    
    if (result.agents.length === 0) {
      console.log("📭 No agents deployed yet");
      return;
    }
    
    console.log(`All agents (showing first 10 of ${result.totalCount}):`);
    for (let i = 0; i < result.agents.length; i++) {
      const agentInfo = await this.utils.getAgentInfo(result.agents[i]);
      console.log(`${i + 1}. ${result.agents[i]}`);
      console.log(`   Owner: ${agentInfo.owner}`);
      console.log(`   Goal: ${agentInfo.goal}`);
      console.log(`   Active: ${agentInfo.isActive ? '✅' : '❌'}`);
      console.log();
    }
  }
  
  async viewAgentDetails() {
    const agentAddress = await this.askQuestion("Enter agent address: ");
    
    if (!agentAddress.trim()) {
      console.log("❌ Agent address cannot be empty");
      return;
    }
    
    const agentInfo = await this.utils.getAgentInfo(agentAddress);
    
    console.log("Agent Details:");
    console.log("==============");
    console.log(`Address: ${agentInfo.address}`);
    console.log(`Owner: ${agentInfo.owner}`);
    console.log(`Goal: ${agentInfo.goal}`);
    console.log(`Active: ${agentInfo.isActive ? '✅' : '❌'}`);
    console.log(`Execution Count: ${agentInfo.executionCount}`);
    console.log(`Last Execution: ${agentInfo.lastExecution > 0 ? new Date(agentInfo.lastExecution * 1000).toLocaleString() : 'Never'}`);
    console.log(`Memory Count: ${agentInfo.memoryCount}`);
    
    if (agentInfo.lastResponse) {
      console.log(`Last Response: ${agentInfo.lastResponse}`);
    }
    
    if (agentInfo.memories.length > 0) {
      console.log("\nMemories:");
      agentInfo.memories.forEach((memory, index) => {
        console.log(`${index + 1}. ${memory.key}: ${memory.value}`);
        console.log(`   Stored: ${new Date(memory.timestamp * 1000).toLocaleString()}`);
      });
    }
  }
  
  async updateAgentGoal() {
    const agentAddress = await this.askQuestion("Enter agent address: ");
    const newGoal = await this.askQuestion("Enter new goal: ");
    
    if (!agentAddress.trim() || !newGoal.trim()) {
      console.log("❌ Agent address and goal cannot be empty");
      return;
    }
    
    await this.utils.updateAgentGoal(agentAddress, newGoal);
  }
  
  async storeAgentMemory() {
    const agentAddress = await this.askQuestion("Enter agent address: ");
    const key = await this.askQuestion("Enter memory key: ");
    const value = await this.askQuestion("Enter memory value: ");
    
    if (!agentAddress.trim() || !key.trim() || !value.trim()) {
      console.log("❌ All fields are required");
      return;
    }
    
    await this.utils.storeAgentMemory(agentAddress, key, value);
  }
  
  async toggleAgentActive() {
    const agentAddress = await this.askQuestion("Enter agent address: ");
    const activeChoice = await this.askQuestion("Activate (y) or Deactivate (n)? ");
    
    if (!agentAddress.trim()) {
      console.log("❌ Agent address cannot be empty");
      return;
    }
    
    const isActive = activeChoice.toLowerCase().startsWith('y');
    await this.utils.setAgentActive(agentAddress, isActive);
  }
  
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }
}

// Start CLI if run directly
if (require.main === module) {
  const cli = new AgentXCLI();
  cli.start().catch(console.error);
}

module.exports = AgentXCLI;
