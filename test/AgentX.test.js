const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentX", function () {
  let AgentFactory, agentFactory;
  let Agent, agent;
  let owner, addr1, addr2;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy AgentFactory
    AgentFactory = await ethers.getContractFactory("AgentFactory");
    agentFactory = await AgentFactory.deploy();
    await agentFactory.waitForDeployment();
  });

  describe("AgentFactory", function () {
    it("Should deploy with correct initial state", async function () {
      expect(await agentFactory.getAgentCount()).to.equal(0);
    });

    it("Should create a new agent", async function () {
      const goal = "Test AI agent goal";
      
      const tx = await agentFactory.createAgent(goal);
      await tx.wait();
      
      expect(await agentFactory.getAgentCount()).to.equal(1);
      
      const userAgents = await agentFactory.getUserAgents(owner.address);
      expect(userAgents.length).to.equal(1);
      
      const agentAddress = userAgents[0];
      expect(await agentFactory.isValidAgent(agentAddress)).to.be.true;
    });

    it("Should emit AgentCreated event", async function () {
      const goal = "Test AI agent goal";
      
      await expect(agentFactory.createAgent(goal))
        .to.emit(agentFactory, "AgentCreated");
    });

    it("Should allow multiple users to create agents", async function () {
      await agentFactory.connect(owner).createAgent("Owner's agent");
      await agentFactory.connect(addr1).createAgent("Addr1's agent");
      await agentFactory.connect(addr2).createAgent("Addr2's agent");
      
      expect(await agentFactory.getAgentCount()).to.equal(3);
      
      const ownerAgents = await agentFactory.getUserAgents(owner.address);
      const addr1Agents = await agentFactory.getUserAgents(addr1.address);
      const addr2Agents = await agentFactory.getUserAgents(addr2.address);
      
      expect(ownerAgents.length).to.equal(1);
      expect(addr1Agents.length).to.equal(1);
      expect(addr2Agents.length).to.equal(1);
    });

    it("Should return paginated agents", async function () {
      // Create 5 agents
      for (let i = 0; i < 5; i++) {
        await agentFactory.createAgent(`Agent ${i}`);
      }
      
      const firstTwo = await agentFactory.getAgents(0, 2);
      const nextTwo = await agentFactory.getAgents(2, 2);
      const lastOne = await agentFactory.getAgents(4, 2);
      
      expect(firstTwo.length).to.equal(2);
      expect(nextTwo.length).to.equal(2);
      expect(lastOne.length).to.equal(1);
    });
  });

  describe("Agent", function () {
    let agentAddress;

    beforeEach(async function () {
      const goal = "Test agent for individual testing";
      await agentFactory.createAgent(goal);
      const userAgents = await agentFactory.getUserAgents(owner.address);
      agentAddress = userAgents[0];
      
      Agent = await ethers.getContractFactory("Agent");
      agent = Agent.attach(agentAddress);
    });

    it("Should initialize with correct values", async function () {
      const agentInfo = await agent.getAgentInfo();
      const [agentOwner, goal, lastResponse, lastExecution, execCount, isActive, memoryCount] = agentInfo;
      
      expect(agentOwner).to.equal(owner.address);
      expect(goal).to.equal("Test agent for individual testing");
      expect(lastResponse).to.equal("");
      expect(execCount).to.equal(0);
      expect(isActive).to.be.true;
      expect(memoryCount).to.equal(0);
    });

    it("Should allow owner to update goal", async function () {
      const newGoal = "Updated agent goal";
      
      await expect(agent.updateGoal(newGoal))
        .to.emit(agent, "GoalUpdated");
      
      expect(await agent.goal()).to.equal(newGoal);
    });

    it("Should not allow non-owner to update goal", async function () {
      const newGoal = "Unauthorized goal update";
      
      await expect(agent.connect(addr1).updateGoal(newGoal))
        .to.be.revertedWith("Only owner can call this function");
    });

    it("Should store and retrieve responses", async function () {
      const response = "AI generated response";
      
      await expect(agent.storeResponse(response))
        .to.emit(agent, "ResponseUpdated");
      
      expect(await agent.lastResponse()).to.equal(response);
      
      const agentInfo = await agent.getAgentInfo();
      expect(agentInfo[4]).to.equal(1); // executionCount should be 1
    });

    it("Should store and retrieve memories", async function () {
      const key = "test_memory";
      const value = "memory value";
      
      await expect(agent.storeMemory(key, value))
        .to.emit(agent, "MemoryStored");
      
      const [retrievedValue, timestamp] = await agent.getMemory(key);
      expect(retrievedValue).to.equal(value);
      expect(timestamp).to.be.gt(0);
    });

    it("Should update existing memory", async function () {
      const key = "test_memory";
      const value1 = "first value";
      const value2 = "updated value";
      
      await agent.storeMemory(key, value1);
      await agent.storeMemory(key, value2);
      
      const [retrievedValue] = await agent.getMemory(key);
      expect(retrievedValue).to.equal(value2);
      
      const memories = await agent.getAllMemories();
      expect(memories.length).to.equal(1); // Should not create duplicate
    });

    it("Should allow activating/deactivating agent", async function () {
      await expect(agent.setActive(false))
        .to.emit(agent, "AgentDeactivated");
      
      let agentInfo = await agent.getAgentInfo();
      expect(agentInfo[5]).to.be.false; // isActive should be false
      
      await expect(agent.setActive(true))
        .to.emit(agent, "AgentActivated");
      
      agentInfo = await agent.getAgentInfo();
      expect(agentInfo[5]).to.be.true; // isActive should be true
    });

    it("Should allow ownership transfer", async function () {
      await agent.transferOwnership(addr1.address);
      
      const agentInfo = await agent.getAgentInfo();
      expect(agentInfo[0]).to.equal(addr1.address);
      
      // Old owner should not be able to update goal
      await expect(agent.updateGoal("Should fail"))
        .to.be.revertedWith("Only owner can call this function");
      
      // New owner should be able to update goal
      await agent.connect(addr1).updateGoal("New owner's goal");
      expect(await agent.goal()).to.equal("New owner's goal");
    });

    it("Should not allow transfer to zero address", async function () {
      await expect(agent.transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWith("New owner cannot be zero address");
    });
  });
});
