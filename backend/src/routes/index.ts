import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);

export default apiRouter;
