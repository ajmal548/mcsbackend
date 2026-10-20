import mongoose, { Schema, Document, Types } from 'mongoose';
import { TERMS_STATUS, TermsStatus } from './terms.constants';

export interface ITermsLean {
  _id: Types.ObjectId;
  title: string;
  content: string;
  version: string;
  status: TermsStatus;
  effectiveDate: Date;
  createdBy: string;
  updatedBy?: string;
  deletedBy?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITermsDocument extends Document<Types.ObjectId>, Omit<ITermsLean, '_id'> {}

const TermsSchema = new Schema<ITermsDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    content: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: TERMS_STATUS,
      default: 'draft',
      index: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    updatedBy: {
      type: String,
      trim: true,
    },
    deletedBy: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique version check among active/non-deleted documents
TermsSchema.index(
  { version: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: { $ne: true } },
  }
);

// Fast compound queries for active published terms
TermsSchema.index(
  { status: 1, isDeleted: 1, effectiveDate: -1 }
);

export const TermsModel = mongoose.model<ITermsDocument>('Terms', TermsSchema);
export default TermsModel;
