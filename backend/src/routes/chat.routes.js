import express from 'express';
import { 
    sendMessage, 
    getHistory, 
    deleteMessage, 
    clearHistory,
    getChatSessions 
} from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/send', protect, chatRateLimiter, sendMessage);
router.get('/history', protect, getHistory);
router.get('/sessions', protect, getChatSessions);
router.delete('/message/:id', protect, deleteMessage);
router.delete('/history', protect, clearHistory);

export default router;
