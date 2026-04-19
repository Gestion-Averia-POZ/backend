import { Router } from 'express';
import { authRoutes } from '../modules/auth';
import { otpRoutes } from '../modules/otp';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/otp', otpRoutes);
router.use('/health', healthRoutes);

export default router;
