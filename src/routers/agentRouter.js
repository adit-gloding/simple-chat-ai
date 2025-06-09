import express from 'express'

import * as controller from '../controllers/agentController.js'

const router = express.Router()

router.post('/', controller.createAgent)
router.get('/', controller.getAllAgents)
router.get('/:id', controller.getAgentById)
router.patch('/:id', controller.updateAgentById)
router.delete('/:id', controller.deleteAgentById)

export default router