/**
 * OpenAI API Configuration
 * OPENAI_KEY: Your OpenAI API key from environment variables
 * OPENAI_URL: Base URL for OpenAI's API endpoints
 */
export const OPENAI_KEY = process.env.OPENAI_API_KEY;
export const OPENAI_URL = 'https://api.openai.com';

if (!OPENAI_KEY) {
    throw new Error('Missing required OPENAI_API_KEY environment variable.');
}

