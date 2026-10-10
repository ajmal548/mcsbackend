import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'mechanic' | 'admin' | 'user';
  refreshToken: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'role',
    },
    role: {
      type: String,
      enum: ['mechanic', 'admin', 'user'],
      default: 'mechanic',
    },
    refreshToken: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.index({ userId: 1, revoked: 1 });

export default mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
