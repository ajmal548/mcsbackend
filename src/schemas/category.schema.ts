import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array';
  required?: boolean;
  options?: string[];
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  types: string[]; // e.g. ["luxury", "premium"] or ["ac mech", "electric mech", "general mechanic"]
  fields: ICategoryField[]; // Dynamic schema fields definition
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    icon: { type: String, default: null },
    types: { type: [String], default: [] },
    fields: [
      {
        name: { type: String, required: true },
        label: { type: String, required: true },
        type: { type: String, required: true, enum: ['string', 'number', 'boolean', 'select', 'array'] },
        required: { type: Boolean, default: false },
        options: { type: [String], default: [] },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICategory>('Category', CategorySchema);
