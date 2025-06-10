/**
 * Agent Controller
 * 
 * This controller handles all operations related to AI agents including:
 * - Creating new agents with OpenAI assistants
 * - Managing agent metadata and configurations
 * - Handling CRUD operations for agents
 * - Integrating with OpenAI's API for assistant and vector store management
 */

import db from '../configs/db.js'

// models
import * as model from '../models/agent.js'

// third party
import sanitize from 'sanitize-filename'
import sanitizeHtml from 'sanitize-html';

// services
import OpenAIService from '../services/openaiService.js'

// utils
import { response, responseWithoutData } from '../utils/response.js'
import { validate } from '../utils/validation.js'
import { logError } from '../services/logError.js';

/**
 * Creates a new agent with associated OpenAI assistant and vector store
 * 
 * Process:
 * 1. Validates required input fields (name, instructions)
 * 2. Sanitizes the agent name and instructions for security
 * 3. Creates a vector store for the agent
 * 4. Creates an OpenAI assistant with specified configuration
 * 5. Stores agent metadata in the database
 * 
 * @param {Object} req - Express request object containing agent data in body
 * @param {Object} res - Express response object
 */
export async function createAgent(req, res) {
    try {
        const data = req.body

        // Validate that required fields are present
        const error = validate(data, ["name", "instructions"])
        if (error) {
            return res.status(400).json(responseWithoutData(400, error))
        }

        // Initialize OpenAI service for API operations
        const openAIService = new OpenAIService()

        // Sanitize and format agent name for system use
        const sanitizedName = sanitize(data.name.replace(/ /g, '-')).toLowerCase()
        const assistantName = `[TEST] ${sanitizedName}`

        // Create vector store for document search capabilities
        const vectorStore = await openAIService.createStoreVector(assistantName)

        // Sanitize instructions to prevent XSS and other injection attacks
        const sanitizedInstructions = sanitizeHtml(data.instructions)

        // configure assistant data
        // name: this is the name of the assistant
        // instructions: 
        // model: this is the model that the assistant will use to search for documents
        // tools: this is the tool that the assistant will use to search for documents
        // tool_resources: this is the vector store id that the assistant will use to search for documents
        // file_search: this is the vector store id that the assistant will use to search for documents
        // response_format: default is text, can be json_object, json_schema, or text
        // temperature: default is 0.7, can be 0.0 to 1.0. 0.0 is the most deterministic, 1.0 is the most random.
        const assistantDataOpenAI = {
            name: assistantName,
            instructions: sanitizedInstructions,
            model: 'gpt-4o',
            tools: [{ "type": "file_search" }],
            tool_resources: { "file_search": { "vector_store_ids": [vectorStore?.id] } },
            // temperature: 1, 
            // response_format: { type: "json_object" } // or "text", or { type: "json_schema", schema: { ... } }
        };

        // Create the OpenAI assistant
        const openAIAssistant = await openAIService.createAssistant(assistantDataOpenAI)

        // Prepare data for database insertion
        const inserData = {
            name: assistantName,
            instructions: sanitizedInstructions,
            assistant_id: openAIAssistant?.id,
            vector_store_id: vectorStore?.id,
            created_at: new Date(),
            updated_at: new Date(),
        }

        // Store agent data in database
        const result = await model.createAgent(db, inserData)
        res.status(200).json(response(200, "Agent created successfully", {
            id: result.insertId,
        }))
    } catch (error) {
        logError(error, 'agentController', 'createAgent')
        res.status(500).json(response(500, "Internal server error", error))
    }
}

/**
 * Retrieves all agents from the database
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getAllAgents(req, res) {
    try {
        const result = await model.getAllAgents(db)
        res.status(200).json(response(200, "Agents fetched successfully", result))
    } catch (error) {
        logError(error, 'agentController', 'getAllAgents')
        res.status(500).json(response(500, "Internal server error", error))
    }
}

/**
 * Retrieves a specific agent by ID
 * 
 * Process:
 * 1. Validates the presence of ID parameter
 * 2. Queries database for agent with matching ID
 * 3. Returns 404 if agent not found
 * 
 * @param {Object} req - Express request object with agent ID in params
 * @param {Object} res - Express response object
 */
export async function getAgentById(req, res) {
    try {
        // Validate ID parameter
        const id = req.params.id
        if (!id) {
            return res.status(400).json(responseWithoutData(400, "ID is required"))
        }

        // Retrieve agent from database
        const result = await model.getAgentById(db, id)

        if (result.length === 0) {
            return res.status(404).json(responseWithoutData(404, "Agent not found"))
        }

        res.status(201).json(response(200, "Agent fetched successfully", result[0]))
    } catch (error) {
        logError(error, 'agentController', 'getAgentById')
        res.status(500).json(response(500, "Internal server error", error))
    }
}

/**
 * Updates an existing agent by ID
 * 
 * Process:
 * 1. Validates ID and required fields
 * 2. Retrieves existing agent
 * 3. Updates OpenAI assistant if name or instructions changed
 * 4. Updates database record
 * 
 * @param {Object} req - Express request object with agent ID in params and update data in body
 * @param {Object} res - Express response object
 */
export async function updateAgentById(req, res) {
    try {
        const id = req.params.id

        if (!id) {
            return res.status(400).json(responseWithoutData(400, "ID is required"))
        }

        const data = req.body

        // Validate required update fields
        const error = validate(data, ["name", "instructions"])
        if (error) {
            return res.status(400).json(responseWithoutData(400, error))
        }

        // Retrieve existing agent
        let agent = await model.getAgentById(db, id)
        if (agent.length === 0) {
            return res.status(404).json(responseWithoutData(404, "Agent not found"))
        }

        agent = agent[0]

        let updateName = agent.name
        let updateInstructions = agent.instructions

        // Process name update if changed
        if (data.name !== agent.name) {
            updateName = sanitize(data.name.replace(/ /g, '-')).toLowerCase()
            if (!updateName.includes('[test]')) {
                updateName = `[TEST] ${updateName}`
            }
        }

        // Process instructions update if changed
        if (data.instructions !== agent.instructions) {
            updateInstructions = sanitizeHtml(data.instructions)
        }

        // Update OpenAI assistant if changes detected
        if ((updateName !== agent.name) || (updateInstructions !== agent.instructions)) {
            const openAIService = new OpenAIService()
            await openAIService.updateAssistant(agent.assistant_id, {
                name: updateName,
                instructions: updateInstructions
            })
        }

        // Update database record
        const updateData = {
            name: updateName,
            instructions: updateInstructions
        }

        await model.updateAgentById(db, updateData, id)
        res.status(200).json(responseWithoutData(200, "Agent updated successfully"))

    } catch (error) {
        logError(error, 'agentController', 'updateAgentById')
        res.status(500).json(response(500, "Internal server error", error))
    }
}

/**
 * Deletes an agent by ID
 * 
 * Process:
 * 1. Validates ID parameter
 * 2. Retrieves agent to ensure it exists
 * 3. Deletes associated vector store
 * 4. Deletes associated OpenAI assistant
 * 5. Removes database record
 * 
 * @param {Object} req - Express request object with agent ID in params
 * @param {Object} res - Express response object
 */
export async function deleteAgentById(req, res) {
    try {
        const id = req.params.id

        if (!id) {
            return res.status(400).json(responseWithoutData(400, "ID is required"))
        }
        
        // Verify agent exists
        let agent = await model.getAgentById(db, id)
        if (agent.length === 0) {
            return res.status(404).json(responseWithoutData(404, "Agent not found"))
        }

        agent = agent[0]

        // Initialize OpenAI service
        const openAIService = new OpenAIService()

        // Delete vector store if exists
        if(agent.vector_store_id) {
            try {
                await openAIService.deleteStoreVector(agent.vector_store_id)
            } catch (error) {
                logError(error, 'agentController', 'deleteAgentById')
            }
        }

        // Delete OpenAI assistant if exists
        if(agent.assistant_id) {
            try {
                await openAIService.deleteAssistant(agent.assistant_id)
            } catch (error) {
                logError(error, 'agentController', 'deleteAgentById')
            }
        }

        // Remove database record
        await model.deleteAgentById(db, id)
        res.status(200).json(responseWithoutData(200, "Agent deleted successfully"))
    } catch (error) {
        logError(error, 'agentController', 'deleteAgentById')
        res.status(500).json(response(500, "Internal server error", error))
    }
}