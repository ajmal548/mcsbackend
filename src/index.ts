import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';

dotenv.config();

import mechanicRoutes from './routes/mechanicRoutes';
import authRoutes from './routes/authRoutes';
import Admin from './models/Admin';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Seed default admin
const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@mycarsol.com' });
    if (!adminExists) {
      const defaultAdmin = new Admin({
        email: 'admin@mycarsol.com',
        password: 'password123', // Will be hashed by pre-save hook
      });
      await defaultAdmin.save();
      console.log('Default admin seeded: admin@mycarsol.com / password123');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

// Seed after connecting to DB
connectDB().then(() => {
  seedAdmin();
});

// Basic Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MYCARSOL API is running' });
});

// API Routes
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
