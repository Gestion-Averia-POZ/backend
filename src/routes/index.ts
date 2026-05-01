import { Router } from 'express';
import { authRoutes } from '../modules/auth';
import { otpRoutes } from '../modules/otp';
import { reportsRoutes } from '../modules/reports';
import { categoriesRoutes } from '../modules/categories';
import { companiesRoutes } from '../modules/companies';
import { failureTypeRoutes } from '../modules/failure-types';
import { notificationsRoutes } from '../modules/notifications';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/otp', otpRoutes);
router.use('/reports', reportsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/companies', companiesRoutes);
router.use('/failure-types', failureTypeRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/health', healthRoutes);

export default router;
