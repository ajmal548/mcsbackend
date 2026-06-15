import { Router } from 'express';
import { authAdmin } from '../controllers/authController';

const router = Router();

router.post('/admin/login', authAdmin);

export default router;
