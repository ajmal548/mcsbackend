import { Router } from 'express';
import {
  createMechanic,
  getMechanics,
  getMechanicById,
  updateMechanic,
  deleteMechanic,
} from '../controllers/mechanicController';
import { validate } from '../middleware/validate';
import {
  createMechanicSchema,
  updateMechanicSchema,
  getMechanicsSchema,
} from '../validators/mechanic.validator';

const router = Router();

// @route   GET /api/mechanics
router.route('/')
  .get(validate(getMechanicsSchema), getMechanics)
  .post(validate(createMechanicSchema), createMechanic);

// @route   GET, PUT, DELETE /api/mechanics/:id
router.route('/:id')
  .get(getMechanicById)
  .put(validate(updateMechanicSchema), updateMechanic)
  .delete(deleteMechanic);

export default router;
