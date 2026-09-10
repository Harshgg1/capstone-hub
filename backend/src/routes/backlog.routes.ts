import { Router } from 'express';
import { BacklogController } from '../controllers/backlog.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Enforce authentication for all backlog routes
router.use(authenticate);

// Product backlog management endpoints
router.get('/:projectId', BacklogController.getProjectBacklog);
router.post('/:projectId/stories', BacklogController.addStoryToBacklog);
router.post('/:projectId/user-stories', BacklogController.addStoryToBacklog);
router.post('/:projectId', BacklogController.addStoryToBacklog);
router.put('/:projectId/reorder', BacklogController.reorderBacklog);
router.patch('/:projectId/reorder', BacklogController.reorderBacklog);

export default router;
