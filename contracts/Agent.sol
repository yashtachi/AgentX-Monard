// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Agent
 * @dev Individual AI agent contract with goal, memory, and response storage
 */
contract Agent {
    address public owner;
    address public factory;
    string public goal;
    string public lastResponse;
    uint256 public lastExecutionTime;
    uint256 public executionCount;
    bool public isActive;
    
    struct Memory {
        string key;
        string value;
        uint256 timestamp;
    }
    
    Memory[] public memories;
    mapping(string => uint256) public memoryIndex;
    
    event GoalUpdated(string newGoal, uint256 timestamp);
    event ResponseUpdated(string response, uint256 timestamp);
    event MemoryStored(string key, string value, uint256 timestamp);
    event AgentActivated(uint256 timestamp);
    event AgentDeactivated(uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this function");
        _;
    }
    
    modifier onlyOwnerOrFactory() {
        require(
            msg.sender == owner || msg.sender == factory,
            "Only owner or factory can call this function"
        );
        _;
    }
    
    constructor(address _owner, string memory _goal) {
        owner = _owner;
        factory = msg.sender;
        goal = _goal;
        isActive = true;
        lastExecutionTime = block.timestamp;
        executionCount = 0;
    }
    
    /**
     * @dev Update the agent's goal
     * @param _newGoal New goal for the agent
     */
    function updateGoal(string memory _newGoal) external onlyOwner {
        goal = _newGoal;
        emit GoalUpdated(_newGoal, block.timestamp);
    }
    
    /**
     * @dev Store AI response (called by off-chain executor)
     * @param _response AI-generated response
     */
    function storeResponse(string memory _response) external onlyOwnerOrFactory {
        lastResponse = _response;
        lastExecutionTime = block.timestamp;
        executionCount++;
        emit ResponseUpdated(_response, block.timestamp);
    }
    
    /**
     * @dev Store memory for the agent
     * @param _key Memory key
     * @param _value Memory value
     */
    function storeMemory(string memory _key, string memory _value) external onlyOwnerOrFactory {
        uint256 index = memoryIndex[_key];
        
        if (index == 0 && memories.length > 0) {
            // Check if key exists
            bool exists = false;
            for (uint256 i = 0; i < memories.length; i++) {
                if (keccak256(bytes(memories[i].key)) == keccak256(bytes(_key))) {
                    memories[i].value = _value;
                    memories[i].timestamp = block.timestamp;
                    exists = true;
                    break;
                }
            }
            
            if (!exists) {
                memories.push(Memory(_key, _value, block.timestamp));
                memoryIndex[_key] = memories.length;
            }
        } else if (index > 0) {
            // Update existing memory
            memories[index - 1].value = _value;
            memories[index - 1].timestamp = block.timestamp;
        } else {
            // First memory or new key
            memories.push(Memory(_key, _value, block.timestamp));
            memoryIndex[_key] = memories.length;
        }
        
        emit MemoryStored(_key, _value, block.timestamp);
    }
    
    /**
     * @dev Get memory by key
     * @param _key Memory key
     * @return value Memory value
     * @return timestamp When the memory was stored
     */
    function getMemory(string memory _key) external view returns (string memory value, uint256 timestamp) {
        for (uint256 i = 0; i < memories.length; i++) {
            if (keccak256(bytes(memories[i].key)) == keccak256(bytes(_key))) {
                return (memories[i].value, memories[i].timestamp);
            }
        }
        return ("", 0);
    }
    
    /**
     * @dev Get all memories
     * @return Array of all memories
     */
    function getAllMemories() external view returns (Memory[] memory) {
        return memories;
    }
    
    /**
     * @dev Get agent status
     * @return agentOwner The owner of the agent
     * @return currentGoal The current goal of the agent
     * @return latestResponse The latest AI response
     * @return lastExecution Timestamp of last execution
     * @return execCount Number of executions
     * @return active Whether the agent is active
     * @return memoryCount Number of stored memories
     */
    function getAgentInfo() external view returns (
        address agentOwner,
        string memory currentGoal,
        string memory latestResponse,
        uint256 lastExecution,
        uint256 execCount,
        bool active,
        uint256 memoryCount
    ) {
        return (
            owner,
            goal,
            lastResponse,
            lastExecutionTime,
            executionCount,
            isActive,
            memories.length
        );
    }
    
    /**
     * @dev Activate/deactivate the agent
     * @param _active New active status
     */
    function setActive(bool _active) external onlyOwner {
        isActive = _active;
        if (_active) {
            emit AgentActivated(block.timestamp);
        } else {
            emit AgentDeactivated(block.timestamp);
        }
    }
    
    /**
     * @dev Transfer ownership of the agent
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
}
