import mongoose, { Schema, Document, Types } from 'mongoose';
import { TERMS_AUDIT_ACTION, TermsAuditAction } from './terms.constants';

export interface ITermsAuditChangeField {
  before: any;
  after: any;
}

export type ITermsAuditChanges = Record<string, ITermsAuditChangeField>;

export interface ITermsAuditLogLean {
  _id: Types.ObjectId;
  action: TermsAuditAction;
  termsId: Types.ObjectId;
  adminId?: Types.ObjectId;
  adminEmail?: string;
  mechanicId?: Types.ObjectId;
  version?: string;
  ip?: string;
  timestamp: Date;
  changes?: ITermsAuditChanges;
  createdAt: Date;
}

export interface ITermsAuditLogDocument
  extends Document<Types.ObjectId>,
    Omit<ITermsAuditLogLean, '_id'> {}

const TermsAuditLogSchema = new Schema<ITermsAuditLogDocument>(
  {
    action: {
      type: String,
      enum: TERMS_AUDIT_ACTION,
      required: true,
      index: true,
    },
    termsId: {
      type: Schema.Types.ObjectId,
      ref: 'Terms',
      required: true,
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: false,
      index: true,
    },
    adminEmail: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    mechanicId: {
      type: Schema.Types.ObjectId,
      ref: 'Mechanic',
      required: false,
      index: true,
    },
    version: {
      type: String,
      required: false,
      trim: true,
    },
    ip: {
      type: String,
      required: false,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    changes: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only immutable log
    versionKey: false,
  }
);

// Indexes for fast querying & sorting
TermsAuditLogSchema.index({ termsId: 1, timestamp: -1 });
TermsAuditLogSchema.index({ adminEmail: 1, timestamp: -1 });
TermsAuditLogSchema.index({ action: 1, timestamp: -1 });

export const TermsAuditLogModel = mongoose.model<ITermsAuditLogDocument>(
  'TermsAuditLog',
  TermsAuditLogSchema
);
export default TermsAuditLogModel;
