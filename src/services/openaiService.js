/**
 * OpenAI Service
 * A comprehensive service class for interacting with OpenAI's API
 * Handles assistants, threads, messages, and file operations
 */

import dotenv from 'dotenv'
import FormData from 'form-data'
import fs from 'fs'
import axiosClient from './axiosClient.js'

import { OPENAI_KEY, OPENAI_URL } from '../configs/constants.js'
import { logError } from './logError.js'

dotenv.config()

class OpenAIService {

    /**
     * Initialize OpenAI service with API credentials and headers
     * Sets up both JSON and multipart headers for different types of requests
     */
    constructor() {
        this.apiKey = OPENAI_KEY;
        this.headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "OpenAI-Beta": "assistants=v2"
        };
        this.headersMultipart = {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${this.apiKey}`,
            "OpenAI-Beta": "assistants=v2"
        }
    }

    /**
     * Error Logging System
     * Creates daily log files in the /errors directory with detailed error information
     * @param {string} source - The source/location of the error
     * @param {string} url - The API endpoint that failed
     * @param {Error} error - The error object
     */
    async logError(source, url, error) {

        const errorMessage = error.response ? error.response.data : error.message;

        logError(errorMessage, source, url)
        
        throw error;
    }

    //===============================================
    /* Assistant API */
    //===============================================
    /**
     * Retrieves details of a specific assistant
     * @param {string} assistantId - The ID of the assistant to retrieve
     * @returns {Promise<Object>} Assistant details
     */
    async getAssistant(assistantId) {
        let url = `${OPENAI_URL}/v1/assistants/${assistantId}`;
        return axiosClient.get(url, { headers: this.headers })
            .then(result => {
                return result.data;
            })
            .catch(error => {
                console.log("🚀 ~ getAssistant " + url + " ~ error:", error)
            });
    }

    /**
     * Creates a new OpenAI assistant with specified configuration
     * @param {Object} data - Assistant configuration (name, instructions, model)
     * @returns {Promise<Object>} Created assistant data
     */
    async createAssistant(data) {
        const url = `${OPENAI_URL}/v1/assistants`;

        // Validate the payload
        if (!data.name || typeof data.name !== 'string') {
            throw new Error("Invalid 'name' in the assistant payload.");
        }
        if (!data.instructions || typeof data.instructions !== 'string') {
            throw new Error("Invalid 'instructions' in the assistant payload.");
        }
        if (!data.model || typeof data.model !== 'string') {
            throw new Error("Invalid 'model' in the assistant payload.");
        }

        try {
            const response = await axiosClient.post(url, data, { headers: this.headers });
            // console.log("Assistant created successfully:", response.data);
            return response.data;
        } catch (error) {
            await this.logError("OpenAIService/createAssistant", url, error);
        }
    }

    /**
     * Updates an existing assistant's configuration
     * Only allows modification of specific fields to prevent invalid updates
     * @param {string} assistantId - The ID of the assistant to update
     * @param {Object} data - New configuration data
     */
    async updateAssistant(assistantId, data) {
        const allowedFields = [
            "model", "name", "description", "instructions",
            "tools", "tool_resources", "metadata",
            "temperature", "top_p", "response_format"
        ];

        // Filter the data object to include only allowed fields
        const filteredData = Object.keys(data)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = data[key];
                return obj;
            }, {});

        const url = `${OPENAI_URL}/v1/assistants/${assistantId}`;

        try {
            const result = await axiosClient.post(url, filteredData, { headers: this.headers });
            return result.data;
        } catch (error) {
            await this.logError("OpenAIService/updateAssistant", url, error);
        }
    }

    /**
     * Deletes an assistant
     * @param {string} assistantId - The ID of the assistant to delete
     */
    async deleteAssistant(assistantId) {
        const url = `${OPENAI_URL}/v1/assistants/${assistantId}`;

        try {
            const result = await axiosClient.delete(url, { headers: this.headers });
            return result.data;
        } catch (error) {
            await this.logError("OpenAIService/deleteAssistant", url, error);
        }
    }

    //===============================================
    /* Thread API */
    //===============================================
    /**
     * Creates a new conversation thread
     * @returns {Promise<Object>} Created thread data
     */
    async createThread() {
        const url = `${OPENAI_URL}/v1/threads`;

        try {
            const result = await axiosClient.post(url, {}, { headers: this.headers });
            return result.data;
        } catch (error) {
            await this.logError("OpenAIService/createThread", url, error);
        }
    }

    /**
     * Retrieves messages from a thread
     * Limited to 10 most recent messages, ordered ascending
     * @param {string} threadId - The thread to fetch messages from
     * @returns {Promise<Array>} List of messages
     */
    async retrieveThreadMessages(threadId) {
        let url = `${OPENAI_URL}/v1/threads/${threadId}/messages?limit=10&order=asc`;

        try {

            const result = await axiosClient.get(url, { headers: this.headers });
            return result.data.data;

        }
        catch (error) {
            await this.logError("OpenAIService/retrieveThreadMessages", url, error);
        }
    }

    /**
     * Deletes a thread and all its messages
     * @param {string} threadId - The thread to delete
     */
    async deleteThread(threadId) {
        let url = `${OPENAI_URL}/v1/threads/${threadId}`;

        try {
            const result = await axiosClient.delete(url, { headers: this.headers });
            return result.data;
        }
        catch (error) {
            await this.logError("OpenAIService/deleteThread", url, error);
        }
    }

    //===============================================
    /* Speech to Text API */
    //===============================================

    /**
     * Sends a message and gets the assistant's response
     * Complex process involving:
     * 1. Adding user message to thread
     * 2. Creating a run (assistant's processing session)
     * 3. Polling run status until complete
     * 4. Retrieving assistant's response
     * 
     * @param {string} message - User's message
     * @param {string} threadId - Thread to send message to
     * @param {string} assistantId - Assistant to process the message
     * @returns {Promise<string>} Assistant's response
     */
    async sendMessage(message, threadId, assistantId) {

        if (!message || !threadId || !assistantId) {
            throw new Error("Invalid 'message, threadId, assistantId' in the assistant payload.");
        }

        let url = `${OPENAI_URL}/v1/threads/${threadId}/messages`;

        let data = {
            role: "user",
            content: message
        };

        try {
            // console.log("🚀 ~ sendMessage ~ data", data);
            await axiosClient.post(url, data, { headers: this.headers });
        } catch (error) {
            await this.logError("OpenAIService/sendMessage 1", url, error);
        }

        try {
            const runResponse = await axiosClient.post(`${OPENAI_URL}/v1/threads/${threadId}/runs`, {
                assistant_id: assistantId,
            }, { headers: this.headers });

            // console.log("🚀 ~ sendMessage ~ runResponse", runResponse.data);
            let run = runResponse.data;

            let response;

            try {
                response = await axiosClient.get(`${OPENAI_URL}/v1/threads/${threadId}/runs/${run.id}`, {
                    headers: this.headers
                });
            } catch (error) {
                await this.logError("OpenAIService/sendMessage 2", url, error);
            }

            // console.log("🚀 ~ sendMessage ~ response", response.data);

            while (response.data.status === "in_progress" || response.data.status === "queued") {

                // console.log("Waiting for OpenAI response...");
                await new Promise((resolve) => setTimeout(resolve, 5000));

                try {
                    response = await axiosClient.get(`${OPENAI_URL}/v1/threads/${threadId}/runs/${run.id}`, {
                        headers: this.headers
                    });
                } catch (error) {
                    await this.logError("OpenAIService/sendMessage 3", url, error);
                }

            }

            let messageListResponse;
            let retries = 5; // Number of retries
            let delay = 5000; // Delay in ms between retries
            let lastMessage;

            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    messageListResponse = await axiosClient.get(`${OPENAI_URL}/v1/threads/${threadId}/messages`, {
                        headers: this.headers
                    });

                    const messageList = messageListResponse.data;

                    lastMessage = messageList.data.filter((message) => message.run_id === run.id && message.role === "assistant").pop();

                    if (lastMessage && lastMessage.content && lastMessage.content[0]["text"].value) {
                        break; // Exit loop if the message is found
                    }

                    console.log(`Retrying to fetch messages... Attempt ${attempt + 1}`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                } catch (error) {
                    await this.logError(`OpenAIService/sendMessage retry ${attempt + 1}`, url, error);
                }
            }

            if (!lastMessage || !lastMessage.content || !lastMessage.content[0]["text"].value) {
                throw new Error("Failed to retrieve assistant message after retries.");
            }

            let resultMessage = lastMessage.content[0]["text"].value;

            // Remove "Assistant:" if present
            if (resultMessage.includes("Assistant:")) {
                resultMessage = resultMessage.replace("Assistant:", "");
            }

            return resultMessage;

        } catch (error) {
            await this.logError("OpenAIService/sendMessage 5", url, error);
        }
    }

    //===============================================
    /* Vector Store */
    //===============================================

    /**
     * Creates a new vector store
     * @param {string} name - Name of the vector store
     * @returns {Promise<Object>} Created vector store data
     */
    async createStoreVector(name) {
        if (!name) {
            return;
        }

        const url = `${OPENAI_URL}/v1/vector_stores`;

        const data = {
            name: name
        }

        try {
            const response = await axiosClient.post(url, data, { headers: this.headers });
            return response.data;

        } catch (error) {
            await this.logError("OpenAIService/createStoreVector", url, error);
        }
    }

    /**
     * Deletes a vector store
     * @param {string} store_id - ID of the vector store to delete
     */
    async deleteStoreVector(store_id) {

        if (!store_id) {
            return
        }

        const url = `${OPENAI_URL}/v1/vector_stores/` + store_id;

        try {
            await axiosClient.delete(url, { headers: this.headers });
        } catch (error) {
            await this.logError("OpenAIService/deleteStoreVector", url, error);
        }
    }

     //===============================================
    /* Files Manage (related to vector store) */
    //===============================================

    /**
     * Inserts files into a vector store
     * @param {string} vector_store_id - ID of the vector store
     * @param {string} file_id - ID of the file to insert
     * @returns {Promise<Object>} Inserted file data
     */
    async createVectorStoreFiles(vector_store_id, file_id) {
        if (!vector_store_id || !file_id) {
            return
        }

        const data = {
            file_id: file_id
        }

        const url = `${OPENAI_URL}/v1/vector_stores/${vector_store_id}/files`;

        try {
            const response = await axiosClient.post(url, data, { headers: this.headers });
            return response.data;
        } catch (error) {
            await this.logError("OpenAIService/createVectorStoreFiles", url, error);
        }
    }

    /**
     * Deletes files from a vector store
     * @param {string} vector_store_id - ID of the vector store
     * @param {string} file_id - ID of the file to delete
     */
    async deleteVectorStoreFiles(vector_store_id, file_id) {
        if (!file_id || !vector_store_id) {
            return
        }

        const url = `${OPENAI_URL}/v1/vector_stores/${vector_store_id}/files/${file_id}`;

        try {
            await axiosClient.delete(url, { headers: this.headers });
        } catch (error) {
            await this.logError("OpenAIService/deleteVectorStoreFiles", url, error);
        }
    }

    /**
     * Uploads a file to OpenAI for use with assistants
     * @param {string} dirFile - Path to the file to upload
     * @returns {Promise<Object>} Uploaded file data
     */
    async uploadFile(dirFile) {
        if (!dirFile) {
            return;
        }

        const url = `${OPENAI_URL}/v1/files`;

        // Create a FormData instance to handle file upload
        const form = new FormData();
        form.append('file', fs.createReadStream(dirFile)); // Add the file stream
        form.append('purpose', 'assistants'); // Add the purpose field

        try {
            const response = await axiosClient.post(url, form, { headers: this.headersMultipart });
            return response.data;
        } catch (error) {
            await this.logError("OpenAIService/uploadFile", url, error);
        }
    }

    /**
     * Deletes a file from OpenAI storage
     * @param {string} file_id - ID of the file to delete
     */
    async deleteFile(file_id) {
        if (!file_id) {
            return
        }

        const url = `${OPENAI_URL}/v1/files/${file_id}`;

        try {
            const response = await axiosClient.delete(url, { headers: this.headers });
            return response.data;
        } catch (error) {
            await this.logError("OpenAIService/deleteFile", url, error);
        }
    }

}

export default OpenAIService;