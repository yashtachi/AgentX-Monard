# AgentX API Documentation

The AgentX API provides a RESTful interface for interacting with AgentX smart contracts and managing AI agents on the blockchain.

## Base URL
```
http://localhost:3001
```

## Authentication
Currently, the API uses the private key from the environment configuration for blockchain interactions. Future versions will support user authentication and multi-wallet support.

## Endpoints

### Health Check

#### `GET /health`
Check if the API server is running.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Network Information

#### `GET /api/network`
Get information about the connected blockchain network.

**Response:**
```json
{
  "network": "monard-testnet",
  "chainId": 12345,
  "walletAddress": "0x...",
  "balance": "1.5",
  "factoryAddress": "0x..."
}
```

### Agents

#### `POST /api/agents`
Create a new AI agent.

**Request Body:**
```json
{
  "goal": "Summarize blockchain news daily"
}
```

**Response:**
```json
{
  "address": "0x...",
  "owner": "0x...",
  "goal": "Summarize blockchain news daily",
  "lastResponse": "",
  "lastExecution": 0,
  "executionCount": 0,
  "isActive": true,
  "memoryCount": 0,
  "memories": []
}
```

#### `GET /api/agents`
Get all agents with pagination.

**Query Parameters:**
- `offset` (number, optional): Starting index (default: 0)
- `limit` (number, optional): Number of agents to return (default: 50)

**Response:**
```json
{
  "agents": [
    {
      "address": "0x...",
      "owner": "0x...",
      "goal": "Agent goal",
      "isActive": true,
      "executionCount": 5
    }
  ],
  "totalCount": 10,
  "hasMore": false,
  "offset": 0,
  "limit": 50
}
```

#### `GET /api/agents/user/:address`
Get all agents owned by a specific user.

**Response:**
```json
[
  {
    "address": "0x...",
    "owner": "0x...",
    "goal": "User's agent goal",
    "isActive": true,
    "executionCount": 3
  }
]
```

#### `GET /api/agents/:address`
Get detailed information about a specific agent.

**Response:**
```json
{
  "address": "0x...",
  "owner": "0x...",
  "goal": "Agent goal",
  "lastResponse": "Last AI response",
  "lastExecution": 1642261800,
  "executionCount": 5,
  "isActive": true,
  "memoryCount": 3,
  "memories": [
    {
      "key": "memory_key",
      "value": "memory_value",
      "timestamp": 1642261800
    }
  ]
}
```

#### `PUT /api/agents/:address/goal`
Update an agent's goal.

**Request Body:**
```json
{
  "goal": "New agent goal"
}
```

**Response:** Returns updated agent information.

#### `POST /api/agents/:address/memory`
Store a memory for an agent.

**Request Body:**
```json
{
  "key": "memory_key",
  "value": "memory_value"
}
```

**Response:** Returns updated agent information.

#### `PUT /api/agents/:address/active`
Activate or deactivate an agent.

**Request Body:**
```json
{
  "isActive": true
}
```

**Response:** Returns updated agent information.

#### `GET /api/agents/:address/executions`
Get execution history for an agent.

**Response:**
```json
{
  "agentAddress": "0x...",
  "totalExecutions": 5,
  "executions": [
    {
      "executionNumber": "4",
      "result": "AI execution result",
      "timestamp": 1642261800,
      "date": "2022-01-15T10:30:00.000Z"
    }
  ]
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (endpoint or resource not found)
- `500` - Internal Server Error

Error responses have the following format:
```json
{
  "error": "Error message description"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. Future versions will include rate limiting to prevent abuse.

## WebSocket Support

Future versions will include WebSocket support for real-time updates on agent executions and blockchain events.

## SDK Support

JavaScript/TypeScript SDK is planned for easier integration with frontend applications.

## Examples

### Creating and Managing an Agent

```javascript
// Create a new agent
const response = await fetch('http://localhost:3001/api/agents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    goal: 'Monitor DeFi protocol updates'
  })
});

const agent = await response.json();
console.log('Agent created:', agent.address);

// Get agent details
const agentResponse = await fetch(`http://localhost:3001/api/agents/${agent.address}`);
const agentDetails = await agentResponse.json();

// Update agent goal
await fetch(`http://localhost:3001/api/agents/${agent.address}/goal`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    goal: 'Updated goal: Monitor DeFi and NFT updates'
  })
});

// Store memory
await fetch(`http://localhost:3001/api/agents/${agent.address}/memory`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    key: 'last_update',
    value: new Date().toISOString()
  })
});
```

## Development

To run the API server locally:

```bash
npm run api
```

The server will start on port 3001 by default. You can change this by setting the `PORT` environment variable.
