import { Request, Response, NextFunction } from 'express';
import { getRouteDirectionsService } from './routes.service';
import AppError from '../../utils/appError';

export const getRouteDirectionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || typeof origin.latitude !== 'number' || typeof origin.longitude !== 'number') {
      throw new AppError('Valid origin latitude and longitude are required', 400);
    }

    if (!destination || typeof destination.latitude !== 'number' || typeof destination.longitude !== 'number') {
      throw new AppError('Valid destination latitude and longitude are required', 400);
    }

    const routeData = await getRouteDirectionsService(origin, destination);

    res.status(200).json({
      status: 'success',
      data: routeData,
    });
  } catch (error) {
    next(error);
  }
};
