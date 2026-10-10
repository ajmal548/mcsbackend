import { Router } from 'express';
import adminRoutes from '../modules/admin/admin.routes';
import adminPaths from '../modules/admin/admin.paths';
import mechanicRoutes from '../modules/mechanic/mechanic.routes';
import mechanicPaths from '../modules/mechanic/mechanic.paths';
import categoryRoutes from '../modules/category/category.routes';
import categoryPaths from '../modules/category/category.paths';
import uploadRoutes from '../modules/upload/upload.routes';
import uploadPaths from '../modules/upload/upload.paths';

import authRoutes from '../modules/auth/auth.routes';
import routesRoutes from '../modules/routes/routes.routes';

const globalRoutes = Router();

globalRoutes.use(adminPaths.root, authRoutes);
globalRoutes.use(adminPaths.root, adminRoutes);
globalRoutes.use(mechanicPaths.root, mechanicRoutes);
globalRoutes.use(categoryPaths.root, categoryRoutes);
globalRoutes.use(uploadPaths.root, uploadRoutes);
globalRoutes.use('/routes', routesRoutes);

export default globalRoutes;
