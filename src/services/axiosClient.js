/**
 * Axios Client Configuration
 * This file sets up a pre-configured axios instance for making HTTP requests to the OpenAI API.
 * It includes default settings and error handling interceptors.
 */

import axios from 'axios'
import https from 'https'

/**
 * Create an axios instance with default configuration
 * - timeout: Maximum time to wait for a response before failing
 * - headers: Default headers sent with every request
 * - httpsAgent: Keep-alive agent for persistent connections
 */
const axiosClient = axios.create({
    timeout: 30000,
    httpsAgent: new https.Agent({ keepAlive: true })
})

export default axiosClient