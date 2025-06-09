import dotenv from 'dotenv'
import http from 'http'
import app from './src/app.js'

dotenv.config()

const port = process.env.APP_PORT

// Create HTTP server and attach Express app
const server = http.createServer(app)

// Start the HTTP server
server.listen(port, () => {
    console.log(`Server is listening on port http://localhost:${port}`)
  });
  
  export default server
