import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Respect authentication rules for all project endpoints
router.use(authenticate);

// Create project
router.post('/', ProjectController.createProject);

// Retrieve all projects
router.get('/', ProjectController.getProjects);

// Retrieve specific project
router.get('/:id', ProjectController.getProjectById);

// Update project
router.put('/:id', ProjectController.updateProject);
router.patch('/:id', ProjectController.updateProject);
// Team member routes
router.get('/:id/members', ProjectController.getTeamMembers);
router.post('/:id/members', ProjectController.addTeamMember);
router.delete('/:id/members/:userId', ProjectController.removeTeamMember);

export default router;

