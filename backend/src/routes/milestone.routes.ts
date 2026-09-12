import { Router } from 'express';
import { MilestoneController } from '../controllers/milestone.controller';
import { DeliverableController } from '../controllers/deliverable.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Enforce authentication for all milestone routes
router.use(authenticate);

// Milestone CRUD
router.post('/', MilestoneController.createMilestone);
router.get('/:id', MilestoneController.getMilestoneById);
router.put('/:id', MilestoneController.updateMilestone);
router.patch('/:id', MilestoneController.updateMilestone);
router.delete('/:id', MilestoneController.deleteMilestone);

// Deliverable sub-routes on a milestone
router.get('/:milestoneId/deliverables', DeliverableController.getDeliverablesByMilestone);
router.post('/:milestoneId/deliverables', DeliverableController.createDeliverable);

export default router;
