import { Router } from 'express';
import reportRoutes from './report.routes';

const router = Router();

router.use('/reports', reportRoutes);

export default router;
