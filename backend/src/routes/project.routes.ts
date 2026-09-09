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

export default router;
