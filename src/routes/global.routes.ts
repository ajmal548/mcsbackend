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
import postRoutes from '../modules/post/post.routes';
import { POST_PATHS } from '../modules/post/post.constants';
import { publicTermsRouter, adminTermsRouter } from '../modules/terms/terms.routes';
import { TERMS_PATHS } from '../modules/terms/terms.constants';

const globalRoutes = Router();

globalRoutes.use(adminPaths.root, authRoutes);
globalRoutes.use(adminPaths.root, adminRoutes);
globalRoutes.use(mechanicPaths.root, mechanicRoutes);
globalRoutes.use(categoryPaths.root, categoryRoutes);
globalRoutes.use(uploadPaths.root, uploadRoutes);
globalRoutes.use('/routes', routesRoutes);
globalRoutes.use(POST_PATHS.ROOT, postRoutes);
globalRoutes.use(TERMS_PATHS.PUBLIC_ROOT, publicTermsRouter);
globalRoutes.use(TERMS_PATHS.ADMIN_ROOT, adminTermsRouter);

export default globalRoutes;
