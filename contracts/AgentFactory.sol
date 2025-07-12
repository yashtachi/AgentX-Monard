// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Agent.sol";

/**
 * @title AgentFactory
 * @dev Factory contract for creating and managing AI agents
 */
contract AgentFactory {
    address[] public agents;
    mapping(address => address[]) public userAgents;
    mapping(address => bool) public isAgent;
    
    event AgentCreated(
        address indexed agent,
        address indexed owner,
        string goal,
        uint256 timestamp
    );
    
    event AgentGoalUpdated(
        address indexed agent,
        string newGoal,
        uint256 timestamp
    );
    
    /**
     * @dev Create a new AI agent
     * @param _goal Initial goal for the agent
     * @return agentAddress Address of the newly created agent
     */
    function createAgent(string memory _goal) external returns (address) {
        Agent newAgent = new Agent(msg.sender, _goal);
        address agentAddress = address(newAgent);
        
        agents.push(agentAddress);
        userAgents[msg.sender].push(agentAddress);
        isAgent[agentAddress] = true;
        
        emit AgentCreated(agentAddress, msg.sender, _goal, block.timestamp);
        
        return agentAddress;
    }
    
    /**
     * @dev Get all agents created by a user
     * @param user Address of the user
     * @return Array of agent addresses
     */
    function getUserAgents(address user) external view returns (address[] memory) {
        return userAgents[user];
    }
    
    /**
     * @dev Get total number of agents
     * @return Total count of agents
     */
    function getAgentCount() external view returns (uint256) {
        return agents.length;
    }
    
    /**
     * @dev Get all agents (paginated)
     * @param offset Starting index
     * @param limit Number of agents to return
     * @return Array of agent addresses
     */
    function getAgents(uint256 offset, uint256 limit) external view returns (address[] memory) {
        require(offset < agents.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > agents.length) {
            end = agents.length;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = agents[i];
        }
        
        return result;
    }
    
    /**
     * @dev Check if an address is a valid agent
     * @param agent Address to check
     * @return True if the address is a valid agent
     */
    function isValidAgent(address agent) external view returns (bool) {
        return isAgent[agent];
    }
}
