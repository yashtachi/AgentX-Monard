const AgentXUtils = require("../utils/AgentXUtils");
const fs = require("fs");
const path = require("path");

class AgentMonitor {
  constructor() {
    this.utils = new AgentXUtils();
    this.monitoringInterval = 30000; // 30 seconds
    this.logFile = path.join(__dirname, "../logs/monitor.log");
    this.isRunning = false;
    
    this.ensureLogDirectory();
  }
  
  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    console.log(logMessage.trim());
    fs.appendFileSync(this.logFile, logMessage);
  }
  
  async start() {
    this.log("🚀 Starting AgentX Monitor...");
    this.isRunning = true;
    
    try {
      const networkInfo = await this.utils.getNetworkInfo();
      this.log(`🌐 Connected to ${networkInfo.network} (Chain ID: ${networkInfo.chainId})`);
      this.log(`🏭 Factory address: ${networkInfo.factoryAddress}`);
      
      // Initial scan
      await this.scanAgents();
      
      // Start periodic monitoring
      this.startPeriodicMonitoring();
      
    } catch (error) {
      this.log(`❌ Failed to start monitor: ${error.message}`);
      process.exit(1);
    }
  }
  
  startPeriodicMonitoring() {
    setInterval(async () => {
      if (this.isRunning) {
        await this.scanAgents();
      }
    }, this.monitoringInterval);
    
    this.log(`⏰ Monitoring started with ${this.monitoringInterval / 1000}s interval`);
  }
  
  async scanAgents() {
    try {
      const result = await this.utils.getAllAgents(0, 1000); // Monitor up to 1000 agents
      
      this.log(`📊 Scanning ${result.agents.length} agents...`);
      
      let activeAgents = 0;
      let totalExecutions = 0;
      let recentExecutions = 0;
      const currentTime = Math.floor(Date.now() / 1000);
      const recentThreshold = currentTime - 3600; // Last hour
      
      for (const agentAddress of result.agents) {
        try {
          const agentInfo = await this.utils.getAgentInfo(agentAddress);
          
          if (agentInfo.isActive) {
            activeAgents++;
          }
          
          totalExecutions += agentInfo.executionCount;
          
          if (agentInfo.lastExecution > recentThreshold) {
            recentExecutions++;
          }
          
          // Check for unusual activity
          await this.checkAgentHealth(agentInfo);
          
        } catch (error) {
          this.log(`⚠️  Error checking agent ${agentAddress}: ${error.message}`);
        }
      }
      
      // Log summary
      this.log(`📈 Summary: ${result.totalCount} total, ${activeAgents} active, ${totalExecutions} total executions, ${recentExecutions} recent executions`);
      
      // Save monitoring data
      await this.saveMonitoringData({
        timestamp: currentTime,
        totalAgents: result.totalCount,
        activeAgents,
        totalExecutions,
        recentExecutions
      });
      
    } catch (error) {
      this.log(`❌ Error during agent scan: ${error.message}`);
    }
  }
  
  async checkAgentHealth(agentInfo) {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastExecution = currentTime - agentInfo.lastExecution;
    
    // Alert if active agent hasn't executed in over 6 hours
    if (agentInfo.isActive && agentInfo.executionCount > 0 && timeSinceLastExecution > 21600) {
      this.log(`⚠️  Agent ${agentInfo.address} hasn't executed in ${Math.floor(timeSinceLastExecution / 3600)} hours`);
    }
    
    // Alert if agent has too many executions (potential spam)
    if (agentInfo.executionCount > 1000) {
      this.log(`⚠️  Agent ${agentInfo.address} has ${agentInfo.executionCount} executions (potential spam)`);
    }
    
    // Alert if agent has unusual memory usage
    if (agentInfo.memoryCount > 100) {
      this.log(`⚠️  Agent ${agentInfo.address} has ${agentInfo.memoryCount} memory entries (high usage)`);
    }
  }
  
  async saveMonitoringData(data) {
    const dataFile = path.join(__dirname, "../logs/monitoring-data.json");
    
    let historicalData = [];
    
    // Load existing data
    try {
      if (fs.existsSync(dataFile)) {
        const content = fs.readFileSync(dataFile, "utf8");
        historicalData = JSON.parse(content);
      }
    } catch (error) {
      this.log(`⚠️  Error loading historical data: ${error.message}`);
    }
    
    // Add new data point
    historicalData.push(data);
    
    // Keep only last 1000 data points
    if (historicalData.length > 1000) {
      historicalData = historicalData.slice(-1000);
    }
    
    // Save updated data
    try {
      fs.writeFileSync(dataFile, JSON.stringify(historicalData, null, 2));
    } catch (error) {
      this.log(`⚠️  Error saving monitoring data: ${error.message}`);
    }
  }
  
  async getMonitoringStats() {
    const dataFile = path.join(__dirname, "../logs/monitoring-data.json");
    
    try {
      if (!fs.existsSync(dataFile)) {
        return { error: "No monitoring data available" };
      }
      
      const content = fs.readFileSync(dataFile, "utf8");
      const data = JSON.parse(content);
      
      if (data.length === 0) {
        return { error: "No monitoring data available" };
      }
      
      const latest = data[data.length - 1];
      const oneHourAgo = latest.timestamp - 3600;
      const oneDayAgo = latest.timestamp - 86400;
      
      const hourlyData = data.filter(d => d.timestamp > oneHourAgo);
      const dailyData = data.filter(d => d.timestamp > oneDayAgo);
      
      return {
        current: latest,
        hourly: {
          dataPoints: hourlyData.length,
          avgActiveAgents: hourlyData.reduce((sum, d) => sum + d.activeAgents, 0) / hourlyData.length,
          totalExecutions: hourlyData.reduce((sum, d) => sum + d.recentExecutions, 0)
        },
        daily: {
          dataPoints: dailyData.length,
          avgActiveAgents: dailyData.reduce((sum, d) => sum + d.activeAgents, 0) / dailyData.length,
          totalExecutions: dailyData.reduce((sum, d) => sum + d.recentExecutions, 0)
        },
        history: data.slice(-24) // Last 24 data points
      };
    } catch (error) {
      return { error: `Failed to load monitoring stats: ${error.message}` };
    }
  }
  
  stop() {
    this.isRunning = false;
    this.log("🛑 AgentX Monitor stopped");
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down monitor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down monitor...');
  process.exit(0);
});

// Start monitor if run directly
if (require.main === module) {
  const monitor = new AgentMonitor();
  monitor.start().catch(console.error);
}

module.exports = AgentMonitor;
