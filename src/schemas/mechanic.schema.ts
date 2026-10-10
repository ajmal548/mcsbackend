import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IKycDocument {
  documentType: 'Aadhaar' | 'PAN' | 'Passport' | 'Driving License' | 'Other';
  documentNumber?: string;
  documentUrl: string;
  frontUrl?: string;
  backUrl?: string;
  isVerified?: boolean;
}

export interface IAddress {
  streetAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  fullAddress: string;
}

export interface ILocation {
  lat: number;
  long: number;
}

export interface ICategorySelection {
  id: mongoose.Types.ObjectId;
  name: string;
  fields?: Record<string, any>; // Dynamic filled fields (experience, certificates, etc.)
}

export interface ISubCategorySelection {
  id?: mongoose.Types.ObjectId;
  name: string;
  fields?: Record<string, any>; // Dynamic sub-category filled fields
}

export interface IMechanic extends Document {
  // Personal Details
  name: string;
  email: string;
  mobile: string;
  password?: string;
  profileImage?: string;

  // Category Object (id, name, fields)
  category: ICategorySelection;

  // SubCategory Objects Array (id, name, fields) - optional
  subCategory?: ISubCategorySelection[];

  // Address & Location
  address: IAddress;
  location?: ILocation;
  radius?: number; // Service dispatch radius in km, default 5km

  // KYC Verification Documents
  kyc?: IKycDocument[];
  kycStatus?: 'pending' | 'approved' | 'rejected';

  // Automatic Status
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';

  accessTokenVersion?: number;
  tokenVersion?: number;

  createdAt: Date;
  updatedAt: Date;

  matchPassword(enteredPassword: string): Promise<boolean>;
}

const CategorySelectionSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    fields: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const SubCategorySelectionSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: 'Category' },
    name: { type: String, required: true },
    fields: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const KycSchema = new Schema(
  {
    documentType: {
      type: String,
      enum: ['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Other'],
      required: true,
    },
    documentNumber: { type: String, default: '' },
    documentUrl: { type: String, required: true },
    frontUrl: { type: String, default: '' },
    backUrl: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    streetAddress: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    fullAddress: { type: String, required: true },
  },
  { _id: false }
);

const MechanicSchema: Schema = new Schema(
  {
    // Personal details
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: {
      type: String,
      required: true,
      unique: true,
      match: [/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'],
    },
    password: { type: String, required: true },
    profileImage: { type: String, default: null },

    // Category object { id, name, fields }
    category: { type: CategorySelectionSchema, required: true },

    // SubCategory objects array [{ id, name, fields }]
    subCategory: { type: [SubCategorySelectionSchema], default: [] },

    // Address & Location
    address: { type: AddressSchema, required: true },
    location: {
      lat: { type: Number },
      long: { type: Number },
    },
    radius: {
      type: Number,
      default: 5,
      min: 1,
    },

    // KYC Upload Documents
    kyc: { type: [KycSchema], default: [] },
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    // Automatic Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'inactive'],
      default: 'pending',
    },

    accessTokenVersion: {
      type: Number,
      default: 0,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

MechanicSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving
MechanicSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

MechanicSchema.index({ name: 'text', email: 'text', mobile: 'text', 'category.name': 'text' });

export default mongoose.model<IMechanic>('Mechanic', MechanicSchema);
