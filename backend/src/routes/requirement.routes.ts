import { Router } from 'express';
import { RequirementController } from '../controllers/requirement.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Enforce authentication for all requirement routes
router.use(authenticate);

// Requirement versions
router.get('/:id/versions', RequirementController.getRequirementVersions);
router.get('/:id/versions/:versionNumber', RequirementController.getRequirementVersionByNumber);

// Requirement CRUD
router.post('/', RequirementController.createRequirement);
router.get('/:id', RequirementController.getRequirementById);
router.put('/:id', RequirementController.updateRequirement);
router.patch('/:id', RequirementController.updateRequirement);
router.delete('/:id', RequirementController.deleteRequirement);

export default router;
