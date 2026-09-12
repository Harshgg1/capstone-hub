import { Router } from 'express';
import { DeliverableController } from '../controllers/deliverable.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Enforce authentication for all deliverable routes
router.use(authenticate);

// Direct deliverable access by ID
router.get('/:id', DeliverableController.getDeliverableById);
router.post('/:id/submit', DeliverableController.submitDeliverable);
router.post('/:id/review', DeliverableController.reviewDeliverable);
router.put('/:id', DeliverableController.updateDeliverable);
router.patch('/:id', DeliverableController.updateDeliverable);
router.delete('/:id', DeliverableController.deleteDeliverable);

export default router;
