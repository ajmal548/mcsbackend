import mongoose, { Schema, Document } from 'mongoose';

export interface IMechanic extends Document {
  businessName: string;
  category: string;
  description: string;
  specialties: string[];
  phone: string;
  city: string;
  address: string;
  openingTime?: string;
  closingTime?: string;
  is24_7: boolean;
  isMobile: boolean;
  location?: {
    lat: number;
    long: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MechanicSchema: Schema = new Schema(
  {
    businessName: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    specialties: { type: [String], default: [] },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    openingTime: { type: String, default: null },
    closingTime: { type: String, default: null },
    is24_7: { type: Boolean, default: false },
    isMobile: { type: Boolean, default: false },
    location: {
      lat: { type: Number },
      long: { type: Number },
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Indexes for searching
MechanicSchema.index({ businessName: 'text', city: 'text', category: 'text' });

export default mongoose.model<IMechanic>('Mechanic', MechanicSchema);
