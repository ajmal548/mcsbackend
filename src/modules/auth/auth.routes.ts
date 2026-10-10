import { Router } from 'express';
import authPaths from './auth.paths';
import * as authController from './auth.controller';
import { handleError } from '../../utils/helpers';

const router = Router();

router.post(authPaths.renewToken, handleError(authController.renewToken));
router.post(authPaths.logout, handleError(authController.logout));

export default router;
