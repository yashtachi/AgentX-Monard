#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class AgentXSetup {
  constructor() {
    this.envPath = path.join(process.cwd(), ".env");
    this.exampleEnvPath = path.join(process.cwd(), ".env.example");
  }
  
  async run() {
    console.log("🧠 AgentX Setup Wizard");
    console.log("=======================\n");
    
    // Check if .env already exists
    if (fs.existsSync(this.envPath)) {
      console.log("✅ .env file already exists");
    } else {
      console.log("📝 Creating .env file from template...");
      fs.copyFileSync(this.exampleEnvPath, this.envPath);
      console.log("✅ .env file created");
    }
    
    console.log("\n🔧 Setup Steps:");
    console.log("================");
    
    console.log("\n1. 📝 Edit your .env file with the following:");
    console.log("   - PRIVATE_KEY: Your wallet private key");
    console.log("   - MONARD_RPC_URL: Monard testnet RPC URL");
    console.log("   - OPENAI_API_KEY: Your OpenAI API key");
    
    console.log("\n2. 🔗 Get test tokens:");
    console.log("   - Visit Monard testnet faucet");
    console.log("   - Request test tokens for your wallet");
    
    console.log("\n3. 🤖 Get OpenAI API key:");
    console.log("   - Visit https://platform.openai.com/api-keys");
    console.log("   - Create a new API key");
    console.log("   - Add it to your .env file");
    
    console.log("\n4. 🚀 Deploy contracts:");
    console.log("   npm run compile");
    console.log("   npm run deploy");
    
    console.log("\n5. 🏃 Run the system:");
    console.log("   npm run dev        # Run executor + API");
    console.log("   npm run dev:full   # Run executor + API + monitor");
    
    console.log("\n6. 🖥️  Use the CLI:");
    console.log("   npm run cli        # Interactive CLI");
    
    console.log("\n📚 Additional Commands:");
    console.log("=======================");
    console.log("   npm test           # Run tests");
    console.log("   npm run monitor    # Run monitoring only");
    console.log("   npm run api        # Run API server only");
    console.log("   npm run executor   # Run executor only");
    
    console.log("\n🔗 Useful Links:");
    console.log("================");
    console.log("   - Documentation: README.md");
    console.log("   - Monard Network: https://monard.network");
    console.log("   - OpenAI API: https://openai.com/api");
    
    console.log("\n🎉 Setup complete! Follow the steps above to get started.");
    console.log("💡 Tip: Start with 'npm run compile' and 'npm test' to verify everything works.");
  }
}

// Run setup if executed directly
if (require.main === module) {
  const setup = new AgentXSetup();
  setup.run().catch(console.error);
}

module.exports = AgentXSetup;
