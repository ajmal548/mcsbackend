import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  mechanicId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  categoryName?: string;
  amount: number;
  destinationAddress?: string;
  destinationLocation?: {
    lat: number;
    lng: number;
  };
  mechanicLocation?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    updatedAt?: Date;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  rating?: number;
  reviewComment?: string;
  scheduledDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema(
  {
    mechanicId: { type: Schema.Types.ObjectId, ref: 'Mechanic', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: '' },
    serviceName: { type: String, required: true },
    categoryName: { type: String, default: '' },
    amount: { type: Number, required: true, default: 0 },
    destinationAddress: { type: String, default: '' },
    destinationLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    mechanicLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      heading: { type: Number, default: 0 },
      speed: { type: Number, default: 0 },
      updatedAt: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    rating: { type: Number, min: 1, max: 5, default: null },
    reviewComment: { type: String, default: '' },
    scheduledDate: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

JobSchema.index({ mechanicId: 1, createdAt: -1 });
JobSchema.index({ mechanicId: 1, status: 1 });

export default mongoose.model<IJob>('Job', JobSchema);
