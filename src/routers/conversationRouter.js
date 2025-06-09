import express from 'express'

import * as controller from '../controllers/conversationController.js'

const router = express.Router()

router.post('/', controller.sendMessageToAgent)
router.get('/agent/:id', controller.getConversationByAgentId)
router.get('/thread/:id/history', controller.getMessageHistoryByThreadId)
// router.get('/:id', controller.getConversationById)
// router.put('/:id', controller.updateConversationById)
// router.delete('/:id', controller.deleteConversationById)

export default router