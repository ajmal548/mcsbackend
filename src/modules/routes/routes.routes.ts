import { Router } from 'express';
import { getRouteDirectionsHandler } from './routes.controller';

const router = Router();

router.post('/directions', getRouteDirectionsHandler);

export default router;
