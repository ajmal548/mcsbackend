import { Request, Response } from 'express';
import Mechanic from '../models/Mechanic';

// @desc    Create a new mechanic
// @route   POST /api/mechanics
// @access  Public (for now)
export const createMechanic = async (req: Request, res: Response): Promise<void> => {
  try {
    const mechanic = new Mechanic(req.body);
    const createdMechanic = await mechanic.save();
    res.status(201).json(createdMechanic);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all mechanics (with pagination, search, filter)
// @route   GET /api/mechanics
// @access  Public
export const getMechanics = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};

    // Search by text index (businessName, city, category)
    if (req.query.search) {
      query.$text = { $search: req.query.search as string };
    }

    // Filter by specific category
    if (req.query.category) {
      query.category = req.query.category;
    }

    const mechanics = await Mechanic.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Mechanic.countDocuments(query);

    res.json({
      data: mechanics,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get single mechanic by ID
// @route   GET /api/mechanics/:id
// @access  Public
export const getMechanicById = async (req: Request, res: Response): Promise<void> => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) {
      res.status(404).json({ message: 'Mechanic not found' });
      return;
    }
    res.json(mechanic);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a mechanic
// @route   PUT /api/mechanics/:id
// @access  Public (for now)
export const updateMechanic = async (req: Request, res: Response): Promise<void> => {
  try {
    const mechanic = await Mechanic.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!mechanic) {
      res.status(404).json({ message: 'Mechanic not found' });
      return;
    }

    res.json(mechanic);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a mechanic
// @route   DELETE /api/mechanics/:id
// @access  Public (for now)
export const deleteMechanic = async (req: Request, res: Response): Promise<void> => {
  try {
    const mechanic = await Mechanic.findByIdAndDelete(req.params.id);

    if (!mechanic) {
      res.status(404).json({ message: 'Mechanic not found' });
      return;
    }

    res.json({ message: 'Mechanic removed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
