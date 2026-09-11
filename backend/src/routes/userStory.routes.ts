import { Router } from 'express';
import { UserStoryController } from '../controllers/userStory.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Enforce authentication for all user story routes
router.use(authenticate);

// User Story CRUD
router.post('/', UserStoryController.createUserStory);
router.get('/:id', UserStoryController.getUserStoryById);
router.put('/:id', UserStoryController.updateUserStory);
router.patch('/:id', UserStoryController.updateUserStory);
router.delete('/:id', UserStoryController.deleteUserStory);

export default router;
