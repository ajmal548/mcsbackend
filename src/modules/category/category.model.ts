import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { CATEGORY_FIELD_TYPES, CategoryFieldType } from './category.constants';

export interface ICategoryField {
  name: string;
  label: string;
  type: CategoryFieldType;
  required: boolean;
  options: string[];
}

export interface ICategoryLean {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  types: string[];
  fields: ICategoryField[];
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryDoc extends Document, Omit<ICategoryLean, '_id'> {
  _id: Types.ObjectId;
}

// Sub-schema with _id: false
const CategoryFieldSchema = new Schema<ICategoryField>(
  {
    name: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: CATEGORY_FIELD_TYPES },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
  },
  { _id: false }
);

export const CategorySchema = new Schema<ICategoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', trim: true },
    icon: { type: String, default: null },
    types: { type: [String], default: [] },
    fields: { type: [CategoryFieldSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Virtual id
CategorySchema.virtual('id').get(function (this: ICategoryDoc) {
  return this._id.toHexString();
});

CategorySchema.set('toJSON', { virtuals: true });
CategorySchema.set('toObject', { virtuals: true });

// Compound indexes with partial filter expressions for soft delete
CategorySchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } }
);

CategorySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } }
);

export const CategoryModel: Model<ICategoryDoc> =
  mongoose.models.Category || mongoose.model<ICategoryDoc>('Category', CategorySchema);

export default CategoryModel;
