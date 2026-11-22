import { Router } from 'express';
import { listConversations, listMessages, markRead, sendMessage, startConversation, unreadCount } from '../controllers/conversationController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';
import { messageListRules, sendMessageRules, startConversationRules } from '../validators/messageValidators.js';

const router = Router();
router.use(authenticate, authorize('customer', 'provider'));

router.post('/', startConversationRules, validate, startConversation); // customers start chats with providers; providers only with their own customers
router.get('/', listConversations);
router.get('/unread-count', unreadCount); // before "/:id"
router.get('/:id/messages', idParam, messageListRules, validate, listMessages);
router.post('/:id/messages', idParam, sendMessageRules, validate, sendMessage);
router.patch('/:id/read', idParam, validate, markRead);

export default router;
