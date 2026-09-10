import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { MilestoneController } from '../controllers/milestone.controller';
import { RequirementController } from '../controllers/requirement.controller';
import { UserStoryController } from '../controllers/userStory.controller';
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
router.patch('/:id/members/:userId/role', ProjectController.updateMemberRole);
router.put('/:id/members/:userId/role', ProjectController.updateMemberRole);
router.patch('/:id/members/:userId', ProjectController.updateMemberRole);

// Milestone routes on project
router.get('/:projectId/milestones', MilestoneController.getMilestones);
router.post('/:projectId/milestones', MilestoneController.createMilestone);

// Requirement routes on project
router.get('/:projectId/requirements', RequirementController.getRequirements);
router.post('/:projectId/requirements', RequirementController.createRequirement);

// User Story routes on project
router.get('/:projectId/stories', UserStoryController.getUserStories);
router.post('/:projectId/stories', UserStoryController.createUserStory);
router.get('/:projectId/user-stories', UserStoryController.getUserStories);
router.post('/:projectId/user-stories', UserStoryController.createUserStory);

export default router;

