// native
import path from 'path';
import fs from 'fs';

// third party
import cors from 'cors'
import express from 'express'

// routers
import agentRouter from './routers/agentRouter.js'
import conversationRouter from './routers/conversationRouter.js'

const app = express()

app.use(cors())

app.use(express.json({
    limit: '50mb',
}))

app.get('/', (req, res) => {
    res.send('Sample chat...')
})

// Serve robots.txt from the root
app.get('/robots.txt', (req, res) => {
    const filePath = path.join(baseDir, 'public/robots.txt');

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).json({ status: 'error', message: 'File Not Found' });
        }

        // Send the file if it exists
        res.sendFile(filePath, (err) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
            }
        });
    });
});

app.use('/v1/agents', agentRouter)
app.use('/v1/conversations', conversationRouter)

export default app