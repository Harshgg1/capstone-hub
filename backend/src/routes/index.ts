import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/projects', projectRoutes);

export default apiRouter;
