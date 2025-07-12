# 🧠 AgentX - Autonomous AI Agents on Blockchain

**Deploy, Run, and Evolve Autonomous AI Agents on the Blockchain**

AgentX is a decentralized framework for creating and managing on-chain AI agents. It empowers users to deploy smart contracts that act as autonomous agents, each with its own goal, memory, and ability to interact with both blockchain and AI systems.

Built on the Monard testnet, AgentX leverages modular blockchain architecture and off-chain AI execution to create a powerful and extensible system where code can literally "think" and act on your behalf.

## 🔍 Problem

AI is transforming how we interact with software, but current AI models are:
- **Centralized and opaque**
- **Stateless and non-trustworthy**  
- **Inaccessible from blockchain environments**

Meanwhile, smart contracts are:
- **Trustless and transparent**
- **Deterministic but static**
- **Difficult to adapt to dynamic real-world logic**

**AgentX bridges this gap.** It enables smart contracts to function as AI-powered agents that can reason, respond, and evolve over time.

## 🎯 What AgentX Does

### 🚀 Deploy Agents
Users create AI agents with a goal (e.g., "Summarize DAO proposals every hour").

### 🔄 Run Autonomously  
A decentralized runner service reads the agent's goals, queries an AI model (like GPT-4), and stores the response on-chain.

### 🔗 Interact On-Chain
AI agents can store knowledge, update goals, emit events, and potentially trigger DeFi actions or DAO votes in the future.

## 🔧 Key Components

| Component | Description |
|-----------|-------------|
| 🧱 **Agent Factory** | A smart contract that creates and manages individual agent contracts |
| 🤖 **Agent Contracts** | Each agent has its own storage for goals and memory |
| 🌐 **Off-chain Executor** | Node.js service that reads goals, calls the AI model, and submits responses on-chain |
| 💬 **OpenAI/GPT API** | Used for goal-driven reasoning and task execution |
| 🧪 **Monard Testnet** | Modular testnet used to deploy, test, and interact with smart contracts |

## ⚙️ Architecture

```
User ⟷ Frontend UI (optional)
     ⬇
Agent Factory Contract ⟷ Agent Contracts (per user)
     ⬇
Off-chain Executor (Node.js)
     ⬇
OpenAI API ↔ Monard RPC
```

## 💡 Use Cases

- 🤖 **Automated DAO Assistants** – summarize proposals, generate comments, vote recommendations
- 📈 **DeFi Monitors** – monitor market trends and suggest strategies  
- 📩 **On-chain Email Agents** – respond to messages, auto-tag, auto-summarize
- 🧠 **Knowledge Agents** – build knowledge graphs for communities and DAOs
- 🎮 **NPCs for Web3 Games** – generate autonomous agent logic for games

## 🚧 Current Status (MVP)

- ✅ Smart contracts (Factory + Agent)
- ✅ Off-chain executor script (Node.js + OpenAI)
- ✅ Monard deployment config
- ✅ Comprehensive test suite
- 🔜 Frontend UI (React)
- 🔜 Multi-agent orchestration
- 🔜 Agent-to-agent communication

## 🔐 Tech Stack

- **Solidity + Hardhat** – Smart contract development
- **Node.js + Ethers.js** – Off-chain runner
- **OpenAI GPT-4 API** – AI reasoning
- **Monard Testnet** – Modular blockchain infra
- **MetaMask** – Wallet interaction

## 🛠️ Installation & Setup

### Prerequisites
- Node.js v18+
- npm or yarn
- MetaMask wallet
- OpenAI API key

### 1. Clone and Install
```bash
git clone https://github.com/yashtachi/AgentX-Monard.git
cd AgentX-Monard
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Blockchain Configuration
MONARD_RPC_URL=https://rpc.monard.network
PRIVATE_KEY=your_private_key_here
MONARD_API_KEY=your_monard_api_key_here

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key_here

# Executor Configuration
EXECUTION_INTERVAL=3600  # 1 hour in seconds
```

### 3. Compile Contracts
```bash
npm run compile
```

### 4. Run Tests
```bash
npm test
```

### 5. Deploy to Monard
```bash
npm run deploy
```

### 6. Start the Executor
```bash
npm run executor
```

## 🛠️ How It Works (Example)

1. **Alice deploys an agent** with goal: "Summarize the latest proposals in our DAO."

2. **The executor runs hourly**, pulls this goal, and sends it to GPT-4.

3. **GPT-4 responds** with a summary.

4. **The executor writes the result** back to the agent contract's `lastResponse` variable.

5. **Alice (or others) can view** the agent's log on-chain.

## 📝 Smart Contract API

### AgentFactory

```solidity
// Create a new agent
function createAgent(string memory _goal) external returns (address)

// Get user's agents
function getUserAgents(address user) external view returns (address[] memory)

// Get all agents (paginated)
function getAgents(uint256 offset, uint256 limit) external view returns (address[] memory)
```

### Agent

```solidity
// Update agent goal
function updateGoal(string memory _newGoal) external

// Store AI response
function storeResponse(string memory _response) external

// Store memory
function storeMemory(string memory _key, string memory _value) external

// Get agent info
function getAgentInfo() external view returns (...)
```

## 🧬 Future Extensions

- 💸 **Agent reward system** (based on accuracy or usefulness)
- 🧠 **Long-term memory for agents** (IPFS/Arweave logs)
- 🔐 **ZK proofs of reasoning steps**
- 🛠 **Deploy your own AI model** (via open-source LLM or API switch)
- 👥 **Multi-agent coordination** (agent DAOs!)

## 🏁 Why Monard?

- **Modular rollup compatibility**
- **Future-proof architecture** (DA, execution, consensus separation)
- **Great for AI x Blockchain experimentation**
- **Low-cost testing environment**

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test
```

Tests cover:
- Agent factory functionality
- Individual agent operations
- Memory management
- Access controls
- Event emissions

## 📊 Project Structure

```
AgentX-Monard/
├── contracts/
│   ├── AgentFactory.sol    # Main factory contract
│   └── Agent.sol          # Individual agent contract
├── executor/
│   └── index.js           # Off-chain executor service
├── scripts/
│   └── deploy.js          # Deployment script
├── test/
│   ├── AgentX.test.js     # Comprehensive tests
│   └── Lock.js            # Legacy test (can be removed)
├── hardhat.config.js      # Hardhat configuration
├── package.json           # Dependencies and scripts
└── .env.example          # Environment template
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: [https://github.com/yashtachi/AgentX-Monard](https://github.com/yashtachi/AgentX-Monard)
- **Monard Network**: [https://monard.network](https://monard.network)
- **OpenAI API**: [https://openai.com/api](https://openai.com/api)

## 📣 TL;DR

🚀 **AgentX turns smart contracts into living AI agents.**  
🔧 **Build, deploy, and evolve on-chain intelligence using Monard and GPT-4.**  
🌟 **The future of autonomous blockchain applications starts here.**

---

Made with ❤️ by the AgentX Team