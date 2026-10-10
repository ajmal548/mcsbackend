import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Job from '../schemas/job.schema';

interface LocationPayload {
  jobId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp?: number;
}

export let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Optional JWT Authentication for Socket Handshake
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/, '');

      if (token) {
        const secret = process.env.JWT_SECRET || 'jwt_secret_key_123';
        const decoded = jwt.verify(token, secret);
        (socket as any).user = decoded;
      }
      return next();
    } catch (err) {
      // Allow connection even if token not present for demo/development flexibility,
      // but authenticated operations can check socket.user
      return next();
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join room for a specific job tracking session
    socket.on('join_job_tracking', async (data: { jobId: string; role?: 'mechanic' | 'driver' }) => {
      try {
        const { jobId, role = 'driver' } = data || {};
        if (!jobId) {
          socket.emit('tracking_error', { message: 'Missing jobId' });
          return;
        }

        const room = `job_${jobId}`;
        socket.join(room);
        console.log(`[Socket] ${socket.id} (${role}) joined ${room}`);

        // Try to fetch latest job location if in database
        try {
          const existingJob = await Job.findById(jobId);
          if (existingJob && existingJob.mechanicLocation?.lat && existingJob.mechanicLocation?.lng) {
            socket.emit('initial_location', {
              jobId,
              latitude: existingJob.mechanicLocation.lat,
              longitude: existingJob.mechanicLocation.lng,
              heading: existingJob.mechanicLocation.heading || 0,
              speed: existingJob.mechanicLocation.speed || 0,
              updatedAt: existingJob.mechanicLocation.updatedAt || new Date(),
              destinationLocation: existingJob.destinationLocation,
              destinationAddress: existingJob.destinationAddress,
            });
          }
        } catch {
          // If jobId is not a Mongo ObjectId (e.g. REQ-8941 mock ID), that's fine
        }

        socket.emit('joined_job_tracking', {
          jobId,
          room,
          status: 'connected',
        });
      } catch (err: any) {
        console.error('[Socket] join_job_tracking error:', err);
        socket.emit('tracking_error', { message: err?.message || 'Failed to join tracking room' });
      }
    });

    // Mechanic publishes fresh GPS coordinates
    socket.on('mechanic_location_update', async (data: LocationPayload) => {
      try {
        const { jobId, latitude, longitude, heading = 0, speed = 0, accuracy = 0, timestamp = Date.now() } = data || {};

        if (!jobId || typeof latitude !== 'number' || typeof longitude !== 'number') {
          socket.emit('tracking_error', { message: 'Invalid coordinates or jobId' });
          return;
        }

        const room = `job_${jobId}`;
        const locationData = {
          jobId,
          latitude,
          longitude,
          heading,
          speed,
          accuracy,
          timestamp,
        };

        // Broadcast to all clients in room (driver listening)
        socket.to(room).emit('location_update', locationData);

        // Also update latest location in MongoDB if job exists
        try {
          await Job.findByIdAndUpdate(jobId, {
            mechanicLocation: {
              lat: latitude,
              lng: longitude,
              heading,
              speed,
              updatedAt: new Date(timestamp),
            },
          });
        } catch {
          // Non-blocking for custom request IDs
        }
      } catch (err: any) {
        console.error('[Socket] mechanic_location_update error:', err);
      }
    });

    // Stop tracking when job ends
    socket.on('end_job_tracking', async (data: { jobId: string; status?: string }) => {
      try {
        const { jobId, status = 'completed' } = data || {};
        if (jobId) {
          const room = `job_${jobId}`;
          io?.to(room).emit('tracking_ended', {
            jobId,
            status,
            endedAt: new Date(),
          });
        }
      } catch (err) {
        console.error('[Socket] end_job_tracking error:', err);
      }
    });

    // Leave tracking room
    socket.on('leave_job_tracking', (data: { jobId: string }) => {
      const { jobId } = data || {};
      if (jobId) {
        const room = `job_${jobId}`;
        socket.leave(room);
        console.log(`[Socket] ${socket.id} left ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};
