/**
 * Conversation Controller
 * 
 * This controller manages conversations between users and AI agents, including:
 * - Managing conversation threads with OpenAI
 * - Handling message history retrieval
 * - Processing and sending messages between users and agents
 * - Managing conversation metadata and state
 */

import db from '../configs/db.js'

import * as model from '../models/conversation.js'
import * as modelAgent from '../models/agent.js'

// services
import OpenAIService from '../services/openaiService.js'

// utils
import { response, responseWithoutData } from '../utils/response.js'
import { validate } from '../utils/validation.js'
import { removeCitations } from '../utils/textFormat.js'
import { logError } from '../services/logError.js'

/**
 * Retrieves or creates a conversation thread for a specific agent
 * 
 * Process:
 * 1. Validates agent ID
 * 2. Retrieves agent information
 * 3. Fetches existing conversation or creates new thread
 * 4. Returns conversation metadata with agent details
 * 
 * @param {Object} req - Express request object with agent ID in params
 * @param {Object} res - Express response object
 */
export async function getConversationByAgentId(req, res) {
    try {
        const agentId = req.params.id

        if (!agentId) {
            return res.status(400).json(responseWithoutData(400, "Agent ID is required"))
        }

        // Verify agent exists and get details
        let agent = await modelAgent.getAgentById(db, agentId)

        if (agent.length === 0) {
            return res.status(404).json(responseWithoutData(404, "Agent not found"))
        }

        agent = agent[0]

        // Get existing conversation or prepare for new one
        let result = await model.getConversationByAgentId(db, agentId)

        let threadId = null

        // Create new thread if no conversation exists
        if (result.length === 0) {
            const openAIService = new OpenAIService()
            threadId = await openAIService.createThread()
            threadId = threadId.id

            // Store new conversation thread in database
            await model.createConversation(db, {
                agent_id: agentId,
                thread_id: threadId,
                created_at: new Date(),
                updated_at: new Date()
            })
        } else {
            threadId = result[0].thread_id
        }

        result = result[0]

        // Prepare response with thread and agent information
        const showResult = {
            thread_id: threadId,
            agent: agent
        }

        res.status(200).json(response(200, "Conversations fetched successfully", showResult))
    } catch (error) {
        logError(error, 'conversationController', 'getConversationByAgentId')
        res.status(500).json(response(500, "Internal server error", error))
    }
}

/**
 * Retrieves message history for a specific conversation thread
 * 
 * Process:
 * 1. Validates thread ID
 * 2. Verifies conversation exists
 * 3. Retrieves messages from OpenAI
 * 
 * @param {Object} req - Express request object with thread ID in params
 * @param {Object} res - Express response object
 */
export async function getMessageHistoryByThreadId(req, res) {
    try {
        const threadId = req.params.id

        if (!threadId) {
            return res.status(400).json(responseWithoutData(400, "Thread ID is required"))
        }

        // Verify conversation exists in database
        let conversation = await model.getConversationByThreadId(db, threadId)

        if (conversation.length === 0) {
            return res.status(404).json(responseWithoutData(404, "Conversation not found"))
        }

        conversation = conversation[0]

        // Retrieve message history from OpenAI
        const openAIService = new OpenAIService()
        const result = await openAIService.retrieveThreadMessages(threadId)

        res.status(200).json(response(200, "Message history fetched successfully", result))

    } catch (error) {
        logError(error, 'conversationController', 'getMessageHistoryByThreadId')
        res.status(500).json(response(500, "Internal server error", error))
    }
}

/**
 * Sends a message to an AI agent and processes the response
 * 
 * Process:
 * 1. Validates required fields (agent_id, thread_id, message)
 * 2. Verifies agent and conversation exist
 * 3. Updates conversation timestamp
 * 4. Sends message to OpenAI and processes response
 * 5. Removes citations if present in response
 * 
 * @param {Object} req - Express request object with message data in body
 * @param {Object} res - Express response object
 */
export async function sendMessageToAgent(req, res) {
    try {
        const data = req.body

        // Validate required message fields
        const requiredFields = ['agent_id', 'thread_id', 'message'];
        const validationError = validate(data, requiredFields);
        if (validationError) {
            return res.status(400).json(responseWithoutData(400, validationError));
        }

        // Verify agent exists
        let agent = await modelAgent.getAgentById(db, data.agent_id)
        if (agent.length === 0) {
            return res.status(404).json(responseWithoutData(404, "Agent not found"))
        }
        agent = agent[0]

        // Verify conversation exists
        let conversation = await model.getConversationByThreadId(db, data.thread_id)
        if (conversation.length === 0) {
            return res.status(404).json(responseWithoutData(404, "Conversation not found"))
        }

        const now = new Date()
        conversation = conversation[0]

        // Update conversation timestamp
        await model.updateConversationById(db, {
            id: conversation.id,
            updated_at: now
        }, conversation.id)

        // Send message to OpenAI and get response
        const openAIService = new OpenAIService()
        let openAIResponse = await openAIService.sendMessage(data.message, data.thread_id, agent.assistant_id);

        // Process response - remove citations if present
        openAIResponse = await removeCitations(openAIResponse)

        console.log('openAIResponse', openAIResponse)

        return res.send(response('success', 'Message has been sent and replied!', {
            message: openAIResponse
        }));

    } catch (error) {
        logError(error, 'conversationController', 'sendMessageToAgent')
        res.status(500).json(response(500, "Internal server error", error))
    }
}