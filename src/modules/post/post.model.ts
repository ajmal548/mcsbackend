import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { POST_MEDIA_TYPE, PostMediaType } from './post.constants';

export interface IPostMedia {
  url: string;
  publicId?: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  duration?: number; // Video length in seconds
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
}

export interface IVehicleInfo {
  make?: string;
  model?: string;
  year?: number | null;
}

export interface IPostLean {
  _id: Types.ObjectId;
  mechanicId: Types.ObjectId;
  title?: string;
  caption: string;
  mediaType: PostMediaType;
  media: IPostMedia[];
  category?: string;
  vehicleInfo?: IVehicleInfo;
  tags?: string[];
  likesCount: number;
  viewsCount: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostDoc extends Document, Omit<IPostLean, '_id'> {
  _id: Types.ObjectId;
}

// Sub-schema with _id: false
const PostMediaSchema = new Schema<IPostMedia>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true, default: '' },
    type: { type: String, enum: ['image', 'video'], required: true },
    thumbnailUrl: { type: String, trim: true, default: '' },
    duration: { type: Number, default: 0 },
    format: { type: String, default: '' },
    bytes: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  { _id: false }
);

const VehicleInfoSchema = new Schema<IVehicleInfo>(
  {
    make: { type: String, trim: true, default: '' },
    model: { type: String, trim: true, default: '' },
    year: { type: Number, default: null },
  },
  { _id: false }
);

export const PostSchema = new Schema<IPostDoc>(
  {
    mechanicId: {
      type: Schema.Types.ObjectId,
      ref: 'Mechanic',
      required: true,
      index: true,
    },
    title: { type: String, trim: true, default: '' },
    caption: { type: String, required: true, trim: true },
    mediaType: {
      type: String,
      enum: POST_MEDIA_TYPE,
      default: 'image',
      index: true,
    },
    media: {
      type: [PostMediaSchema],
      required: true,
      validate: [(val: IPostMedia[]) => val.length > 0, 'Post must contain at least one media item'],
    },
    category: { type: String, trim: true, default: '', index: true },
    vehicleInfo: { type: VehicleInfoSchema, default: () => ({}) },
    tags: { type: [String], default: [] },
    likesCount: { type: Number, default: 0, min: 0 },
    viewsCount: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Virtual id
PostSchema.virtual('id').get(function (this: IPostDoc) {
  return this._id.toHexString();
});

PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

// Compound indexes for mobile app feed queries
PostSchema.index({ mechanicId: 1, isDeleted: 1, createdAt: -1 });
PostSchema.index({ mediaType: 1, isDeleted: 1, createdAt: -1 });
PostSchema.index({ category: 1, isDeleted: 1, createdAt: -1 });
PostSchema.index({ isDeleted: 1, createdAt: -1 });

export const PostModel: Model<IPostDoc> =
  mongoose.models.Post || mongoose.model<IPostDoc>('Post', PostSchema);

export default PostModel;
