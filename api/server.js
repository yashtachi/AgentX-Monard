const express = require("express");
const cors = require("cors");
const AgentXUtils = require("../utils/AgentXUtils");

class AgentXAPI {
  constructor() {
    this.app = express();
    this.utils = new AgentXUtils();
    this.port = process.env.PORT || 3001;
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }
  
  setupRoutes() {
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({ status: "OK", timestamp: new Date().toISOString() });
    });
    
    // Network info
    this.app.get("/api/network", async (req, res) => {
      try {
        const networkInfo = await this.utils.getNetworkInfo();
        res.json(networkInfo);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Create agent
    this.app.post("/api/agents", async (req, res) => {
      try {
        const { goal } = req.body;
        
        if (!goal || !goal.trim()) {
          return res.status(400).json({ error: "Goal is required" });
        }
        
        const agentAddress = await this.utils.createAgent(goal);
        const agentInfo = await this.utils.getAgentInfo(agentAddress);
        
        res.json({
          address: agentAddress,
          ...agentInfo
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get all agents (paginated)
    this.app.get("/api/agents", async (req, res) => {
      try {
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 50;
        
        const result = await this.utils.getAllAgents(offset, limit);
        
        // Get detailed info for each agent
        const agentsWithInfo = await Promise.all(
          result.agents.map(async (address) => {
            try {
              const info = await this.utils.getAgentInfo(address);
              return info;
            } catch (error) {
              console.error(`Error getting info for agent ${address}:`, error);
              return { address, error: "Failed to load info" };
            }
          })
        );
        
        res.json({
          agents: agentsWithInfo,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          offset,
          limit
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get user's agents
    this.app.get("/api/agents/user/:address", async (req, res) => {
      try {
        const { address } = req.params;
        const agents = await this.utils.getUserAgents(address);
        
        const agentsWithInfo = await Promise.all(
          agents.map(async (agentAddress) => {
            try {
              const info = await this.utils.getAgentInfo(agentAddress);
              return info;
            } catch (error) {
              console.error(`Error getting info for agent ${agentAddress}:`, error);
              return { address: agentAddress, error: "Failed to load info" };
            }
          })
        );
        
        res.json(agentsWithInfo);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get agent details
    this.app.get("/api/agents/:address", async (req, res) => {
      try {
        const { address } = req.params;
        const agentInfo = await this.utils.getAgentInfo(address);
        res.json(agentInfo);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Update agent goal
    this.app.put("/api/agents/:address/goal", async (req, res) => {
      try {
        const { address } = req.params;
        const { goal } = req.body;
        
        if (!goal || !goal.trim()) {
          return res.status(400).json({ error: "Goal is required" });
        }
        
        await this.utils.updateAgentGoal(address, goal);
        const agentInfo = await this.utils.getAgentInfo(address);
        
        res.json(agentInfo);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Store agent memory
    this.app.post("/api/agents/:address/memory", async (req, res) => {
      try {
        const { address } = req.params;
        const { key, value } = req.body;
        
        if (!key || !value) {
          return res.status(400).json({ error: "Key and value are required" });
        }
        
        await this.utils.storeAgentMemory(address, key, value);
        const agentInfo = await this.utils.getAgentInfo(address);
        
        res.json(agentInfo);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Activate/deactivate agent
    this.app.put("/api/agents/:address/active", async (req, res) => {
      try {
        const { address } = req.params;
        const { isActive } = req.body;
        
        if (typeof isActive !== "boolean") {
          return res.status(400).json({ error: "isActive must be a boolean" });
        }
        
        await this.utils.setAgentActive(address, isActive);
        const agentInfo = await this.utils.getAgentInfo(address);
        
        res.json(agentInfo);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get agent execution history (memories with execution prefix)
    this.app.get("/api/agents/:address/executions", async (req, res) => {
      try {
        const { address } = req.params;
        const agentInfo = await this.utils.getAgentInfo(address);
        
        const executions = agentInfo.memories
          .filter(memory => memory.key.startsWith('execution_'))
          .sort((a, b) => b.timestamp - a.timestamp)
          .map(memory => ({
            executionNumber: memory.key.replace('execution_', ''),
            result: memory.value,
            timestamp: memory.timestamp,
            date: new Date(memory.timestamp * 1000).toISOString()
          }));
        
        res.json({
          agentAddress: address,
          totalExecutions: agentInfo.executionCount,
          executions
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Error handling middleware
    this.app.use((error, req, res, next) => {
      console.error("API Error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error.message
      });
    });
    
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: "Endpoint not found" });
    });
  }
  
  start() {
    this.app.listen(this.port, () => {
      console.log(`🌐 AgentX API server running on port ${this.port}`);
      console.log(`📡 Health check: http://localhost:${this.port}/health`);
      console.log(`📋 API documentation: http://localhost:${this.port}/api`);
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const api = new AgentXAPI();
  api.start();
}

module.exports = AgentXAPI;
