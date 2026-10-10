import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import Database from './config/mongodb.config';
import Admin from './schemas/admin.schema';
import { initSocketServer } from './socket/socketServer';

const PORT = process.env.PORT || 5000;
const db = new Database();

// Seed default admin if not exists
const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@mycarsol.com' });
    if (!adminExists) {
      const defaultAdmin = new Admin({
        email: 'admin@mycarsol.com',
        password: 'password123',
      });
      await defaultAdmin.save();
      console.log('Default admin seeded: admin@mycarsol.com / password123');
    }
  } catch (error) {
    console.error('Error seeding default admin:', error);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err.message, err.stack);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err: any) => {
  console.error('Unhandled Rejection:', err?.message || err);
});

const startServer = async () => {
  try {
    await db.connectDb();
    await seedAdmin();
    const server = http.createServer(app);
    initSocketServer(server);
    server.listen(PORT, () => {
      console.log(`Server & WebSocket running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
