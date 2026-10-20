import Mechanic, { IMechanic, IKycDocument } from '../../schemas/mechanic.schema';
import Job from '../../schemas/job.schema';
import AppError, { ConflictError } from '../../utils/appError';
import { generateToken, generateAndSaveToken } from '../../utils/helpers';

export const loginMechanicService = async (loginData: {
  email?: string;
  mobile?: string;
  password: string;
}) => {
  const identifier = (loginData.email || loginData.mobile || '').trim();
  if (!identifier) {
    throw new AppError('Email or mobile number is required', 400);
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const cleanDigits = identifier.replace(/[^0-9]/g, '');
  if (!isEmail && cleanDigits.length > 0 && cleanDigits.length !== 10) {
    throw new AppError('Mobile number must be exactly 10 digits', 400);
  }
  const searchIdentifier = (!isEmail && cleanDigits.length === 10) ? cleanDigits : identifier;

  const mechanic = await Mechanic.findOne({
    $or: [{ email: searchIdentifier }, { mobile: searchIdentifier }],
  });

  if (!mechanic) {
    throw new AppError('Invalid email/mobile or password', 401);
  }

  const isMatch = await mechanic.matchPassword(loginData.password);
  if (!isMatch) {
    throw new AppError('Invalid email/mobile or password', 401);
  }

  if (mechanic.status === 'inactive') {
    throw new AppError('Account is deactivated. Please contact support.', 403);
  }

  const { accessToken, refreshToken } = await generateAndSaveToken(mechanic, 'mechanic');

  const mechanicObj = mechanic.toObject();
  delete mechanicObj.password;

  return {
    accessToken,
    refreshToken,
    token: accessToken,
    ...mechanicObj,
    mechanic: mechanicObj,
  };
};

export const createMechanicService = async (
  mechanicData: any,
  context?: { ip?: string }
) => {
  const { email } = mechanicData;
  const cleanMobile = (mechanicData.mobile || '').replace(/[^0-9]/g, '');

  if (!cleanMobile || cleanMobile.length !== 10) {
    throw new AppError('Mobile number must be exactly 10 digits', 400);
  }
  mechanicData.mobile = cleanMobile;
  const mobile = cleanMobile;

  const existingEmail = await Mechanic.findOne({ email });
  if (existingEmail) {
    throw new AppError('Mechanic / Service provider with this email already exists', 400);
  }

  const existingMobile = await Mechanic.findOne({ mobile });
  if (existingMobile) {
    throw new AppError('Mechanic / Service provider with this mobile number already exists', 400);
  }

  // 1. Mandatory Terms & Conditions Verification
  if (!mechanicData.accepted) {
    throw new AppError('You must accept the Terms & Conditions to complete registration', 400);
  }

  const TermsModel = (await import('../terms/terms.model')).default;
  const TermsAuditLogModel = (await import('../terms/termsAuditLog.model')).default;

  const activeTerms = await TermsModel.findOne({
    status: 'published',
    isDeleted: { $ne: true },
  }).lean();

  if (!activeTerms) {
    throw new AppError(
      'No published Terms & Conditions are currently active. Please contact administrator.',
      500
    );
  }

  // Verify that the accepted termsId and termsVersion match the currently published active T&C
  const isIdMatching = activeTerms._id.toString() === mechanicData.termsId?.toString();
  const isVersionMatching = activeTerms.version === mechanicData.termsVersion;

  if (!isIdMatching || !isVersionMatching) {
    throw new ConflictError(
      'Terms & Conditions version has changed or is outdated. Please review and accept the latest terms.',
      'TERMS_OUTDATED'
    );
  }

  // All new mechanic registrations are subject to manual Admin review.
  // KYC status and account status ALWAYS initialize to 'pending'.
  const initialKycStatus = 'pending';
  const initialStatus = 'pending';
  const initialRadius = typeof mechanicData.radius === 'number' && mechanicData.radius > 0 ? mechanicData.radius : 5;

  const processedKyc: IKycDocument[] = (mechanicData.kyc || []).map((doc: any) => ({
    ...doc,
    isVerified: false,
  }));

  let initialLocation: any = { type: 'Point', coordinates: [0, 0] };
  if (mechanicData.location) {
    const rawLoc = mechanicData.location as any;
    if (Array.isArray(rawLoc.coordinates) && rawLoc.coordinates.length === 2) {
      initialLocation = { type: 'Point', coordinates: [rawLoc.coordinates[0], rawLoc.coordinates[1]] };
    } else {
      const lat = rawLoc.latitude ?? rawLoc.lat ?? 0;
      const lng = rawLoc.longitude ?? rawLoc.long ?? 0;
      initialLocation = { type: 'Point', coordinates: [lng, lat] };
    }
  }

  const acceptedAt = new Date(); // Server-assigned UTC timestamp

  const mechanic = new Mechanic({
    ...mechanicData,
    location: initialLocation,
    kyc: processedKyc,
    kycStatus: initialKycStatus,
    status: initialStatus,
    isVerified: false,
    radius: initialRadius,
    termsId: activeTerms._id,
    termsVersion: activeTerms.version,
    termsAccepted: true,
    termsAcceptedAt: acceptedAt,
    termsAcceptedIp: context?.ip || null,
  });

  await mechanic.save();

  // Write immutable audit entry for the acceptance (mechanicId, termsId, version, timestamp)
  try {
    await TermsAuditLogModel.create({
      action: 'ACCEPT',
      termsId: activeTerms._id,
      mechanicId: mechanic._id,
      version: activeTerms.version,
      ip: context?.ip || undefined,
      timestamp: acceptedAt,
    });
  } catch (auditErr) {
    console.error('Failed to log terms acceptance audit:', auditErr);
  }

  const { accessToken, refreshToken } = await generateAndSaveToken(mechanic, 'mechanic');

  const mechanicObj = mechanic.toObject();
  delete mechanicObj.password;

  return {
    accessToken,
    refreshToken,
    token: accessToken,
    ...mechanicObj,
    mechanic: mechanicObj,
  };
};

export const getMechanicsService = async (queryParams: {
  page?: string;
  limit?: string;
  search?: string;
  categoryId?: string;
  status?: string;
}) => {
  const page = parseInt(queryParams.page || '1');
  const limit = parseInt(queryParams.limit || '10');
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (queryParams.search) {
    filter.$or = [
      { name: { $regex: queryParams.search, $options: 'i' } },
      { email: { $regex: queryParams.search, $options: 'i' } },
      { mobile: { $regex: queryParams.search, $options: 'i' } },
      { 'category.name': { $regex: queryParams.search, $options: 'i' } },
      { 'subCategory.name': { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  if (queryParams.categoryId) {
    filter['category.id'] = queryParams.categoryId;
  }

  if (queryParams.status) {
    filter.status = queryParams.status;
  }

  const mechanics = await Mechanic.find(filter)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Mechanic.countDocuments(filter);

  return {
    data: mechanics,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getMechanicByIdService = async (id: string) => {
  const mechanic = await Mechanic.findById(id).select('-password');
  if (!mechanic) {
    throw new AppError('Mechanic not found', 404);
  }
  return mechanic;
};

export const updateMechanicService = async (
  id: string,
  updateData: Partial<IMechanic>,
  options: { isAdmin?: boolean } = {}
) => {
  const mechanic = await Mechanic.findById(id);

  if (!mechanic) {
    throw new AppError('Mechanic not found', 404);
  }

  const { isAdmin = false } = options;

  if (updateData.email && updateData.email !== mechanic.email) {
    const existing = await Mechanic.findOne({ email: updateData.email, _id: { $ne: id } });
    if (existing) {
      throw new AppError('Email is already in use by another mechanic', 400);
    }
  }

  if (updateData.mobile) {
    const cleanMobile = updateData.mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length !== 10) {
      throw new AppError('Mobile number must be exactly 10 digits', 400);
    }
    updateData.mobile = cleanMobile;
    if (updateData.mobile !== mechanic.mobile) {
      const existing = await Mechanic.findOne({ mobile: updateData.mobile, _id: { $ne: id } });
      if (existing) {
        throw new AppError('Mobile number is already in use by another mechanic', 400);
      }
    }
  }

const areKycDocsEqual = (existingDocs: IKycDocument[] = [], newDocs: IKycDocument[] = []): boolean => {
  if (existingDocs.length !== newDocs.length) return false;
  return existingDocs.every((existing, idx) => {
    const next = newDocs[idx];
    if (!next) return false;
    return (
      existing.documentType === next.documentType &&
      (existing.documentNumber || '') === (next.documentNumber || '') &&
      (existing.documentUrl || '') === (next.documentUrl || '') &&
      (existing.frontUrl || '') === (next.frontUrl || '') &&
      (existing.backUrl || '') === (next.backUrl || '')
    );
  });
};

  // Non-admins CANNOT approve KYC or self-activate account if KYC is not approved
  if (!isAdmin) {
    delete updateData.kycStatus;

    if (updateData.kyc !== undefined) {
      const isChanged = !areKycDocsEqual(mechanic.kyc || [], updateData.kyc || []);
      if (isChanged) {
        // Mechanic changed or deleted KYC documents: auto-reset status and kycStatus to pending
        updateData.kycStatus = 'pending';
        updateData.status = 'pending';
        updateData.isVerified = false;
        updateData.kyc = (updateData.kyc || []).map((doc) => ({ ...doc, isVerified: false }));
      } else {
        // KYC documents were not modified, preserve existing verification flags
        delete updateData.kyc;
      }
    }

    if (mechanic.kycStatus !== 'approved' && (updateData.status === 'active' || updateData.status === 'verified')) {
      delete updateData.status;
    }
  } else {
    // Admin is modifying KYC status
    if (updateData.kycStatus) {
      if (updateData.kycStatus === 'approved') {
        updateData.status = 'verified';
        updateData.isVerified = true;
        if (mechanic.kyc && mechanic.kyc.length > 0) {
          mechanic.kyc = mechanic.kyc.map((doc) => ({ ...doc, isVerified: true }));
        }
      } else if (updateData.kycStatus === 'rejected') {
        // Admin rejected KYC: mechanic status auto changes to pending
        updateData.status = 'pending';
        updateData.isVerified = false;
        if (mechanic.kyc && mechanic.kyc.length > 0) {
          mechanic.kyc = mechanic.kyc.map((doc) => ({ ...doc, isVerified: false }));
        }
      } else {
        updateData.status = 'pending';
        updateData.isVerified = false;
        if (mechanic.kyc && mechanic.kyc.length > 0) {
          mechanic.kyc = mechanic.kyc.map((doc) => ({ ...doc, isVerified: false }));
        }
      }
    }
  }

  if (updateData.location) {
    const rawLoc = updateData.location as any;
    if (Array.isArray(rawLoc.coordinates) && rawLoc.coordinates.length === 2) {
      updateData.location = {
        type: 'Point',
        coordinates: [rawLoc.coordinates[0], rawLoc.coordinates[1]],
      } as any;
    } else {
      const lat = rawLoc.latitude ?? rawLoc.lat;
      const lng = rawLoc.longitude ?? rawLoc.long;
      if (typeof lat === 'number' && typeof lng === 'number') {
        updateData.location = {
          type: 'Point',
          coordinates: [lng, lat],
        } as any;
      }
    }
  }

  Object.assign(mechanic, updateData);
  await mechanic.save();

  const mechanicObj = mechanic.toObject();
  delete mechanicObj.password;

  return mechanicObj;
};

export const updateKycService = async (
  id: string,
  options: {
    kyc?: IKycDocument[];
    kycStatus?: 'pending' | 'approved' | 'rejected';
    isAdmin?: boolean;
  }
) => {
  const mechanic = await Mechanic.findById(id);

  if (!mechanic) {
    throw new AppError('Mechanic not found', 404);
  }

  const { kyc: kycDocs, kycStatus: targetKycStatus, isAdmin = false } = options;

  let kycStatus: 'pending' | 'approved' | 'rejected' = 'pending';

  if (isAdmin && targetKycStatus) {
    kycStatus = targetKycStatus;
  } else {
    // Mechanic submitting/updating documents is ALWAYS pending manual review by Admin
    kycStatus = 'pending';
  }

  const isApproved = kycStatus === 'approved';

  if (kycDocs !== undefined) {
    const processedKyc: IKycDocument[] = (kycDocs || []).map((doc) => ({
      ...doc,
      isVerified: isApproved,
    }));
    mechanic.kyc = processedKyc;
  } else if (mechanic.kyc && mechanic.kyc.length > 0) {
    mechanic.kyc = mechanic.kyc.map((doc) => ({
      ...doc,
      isVerified: isApproved,
    }));
  }

  mechanic.kycStatus = kycStatus;
  mechanic.isVerified = isApproved;

  // KYC Approval and Status Lifecycle:
  // 1. Admin approves KYC -> mechanic status is verified
  // 2. Mechanic updates/changes KYC documents -> status & kycStatus auto reset to pending
  // 3. Admin rejects approved KYC -> kycStatus='rejected', status auto changes to pending
  if (kycStatus === 'approved') {
    mechanic.status = 'verified';
  } else {
    mechanic.status = 'pending';
  }

  await mechanic.save();

  const mechanicObj = mechanic.toObject();
  delete mechanicObj.password;

  let message = 'KYC documents submitted successfully. Verification status is pending manual review by Admin.';
  if (kycStatus === 'approved') {
    message = 'KYC documents approved by Admin. Mechanic status is now verified.';
  } else if (kycStatus === 'rejected') {
    message = 'KYC documents rejected by Admin. Mechanic status is marked as pending.';
  }

  return {
    message,
    data: mechanicObj,
  };
};

export const deleteKycService = async (
  id: string,
  options?: {
    documentType?: string;
    isAdmin?: boolean;
  }
) => {
  const mechanic = await Mechanic.findById(id);

  if (!mechanic) {
    throw new AppError('Mechanic not found', 404);
  }

  const { documentType } = options || {};

  if (documentType) {
    mechanic.kyc = (mechanic.kyc || []).filter(
      (doc) => doc.documentType.toLowerCase() !== documentType.toLowerCase()
    );
  } else {
    mechanic.kyc = [];
  }

  if (mechanic.kyc && mechanic.kyc.length > 0) {
    mechanic.kyc = mechanic.kyc.map((doc) => ({ ...doc, isVerified: false }));
  }

  // Deleting KYC documents resets KYC status and mechanic status to pending
  mechanic.kycStatus = 'pending';
  mechanic.status = 'pending';
  mechanic.isVerified = false;

  await mechanic.save();

  const mechanicObj = mechanic.toObject();
  delete mechanicObj.password;

  return {
    message: 'KYC documents removed successfully. KYC status and mechanic status are now pending.',
    data: mechanicObj,
  };
};

export const deleteMechanicService = async (id: string) => {
  const mechanic = await Mechanic.findByIdAndDelete(id);

  if (!mechanic) {
    throw new AppError('Mechanic not found', 404);
  }

  return { message: 'Mechanic removed successfully' };
};

export const getMechanicOverviewService = async (id: string) => {
  const mechanic = await Mechanic.findById(id).select('-password');
  if (!mechanic) {
    throw new AppError('Mechanic not found', 404);
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const mechanicObjectId = mechanic._id;

  const [todayJobsCount, completedJobsCount, activeJobsCount, cancelledJobsCount] = await Promise.all([
    Job.countDocuments({
      mechanicId: mechanicObjectId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    }),
    Job.countDocuments({ mechanicId: mechanicObjectId, status: 'completed' }),
    Job.countDocuments({ mechanicId: mechanicObjectId, status: { $in: ['pending', 'in_progress'] } }),
    Job.countDocuments({ mechanicId: mechanicObjectId, status: 'cancelled' }),
  ]);

  const totalEarningsAgg = await Job.aggregate([
    { $match: { mechanicId: mechanicObjectId, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalEarnings = totalEarningsAgg.length > 0 ? totalEarningsAgg[0].total : 0;

  const todayEarningsAgg = await Job.aggregate([
    {
      $match: {
        mechanicId: mechanicObjectId,
        status: 'completed',
        updatedAt: { $gte: startOfToday, $lte: endOfToday },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const todayEarnings = todayEarningsAgg.length > 0 ? todayEarningsAgg[0].total : 0;

  const ratingAgg = await Job.aggregate([
    { $match: { mechanicId: mechanicObjectId, rating: { $ne: null } } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const rating = ratingAgg.length > 0 ? parseFloat(ratingAgg[0].avgRating.toFixed(1)) : 0;
  const totalReviews = ratingAgg.length > 0 ? ratingAgg[0].count : 0;

  const recentJobs = await Job.find({ mechanicId: mechanicObjectId })
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    mechanicId: mechanic._id,
    mechanicName: mechanic.name,
    categoryName: mechanic.category?.name,
    status: mechanic.status,
    overview: {
      todayJobs: todayJobsCount,
      completedJobs: completedJobsCount,
      activeJobs: activeJobsCount,
      cancelledJobs: cancelledJobsCount,
      totalEarnings,
      todayEarnings,
      rating,
      totalReviews,
    },
    recentJobs,
  };
};

export const updateMechanicLocationService = async (
  id: string,
  coords: { latitude: number; longitude: number }
) => {
  const mechanic = await Mechanic.findById(id);
  if (!mechanic) {
    throw new AppError('Mechanic not found', 404);
  }

  const { latitude, longitude } = coords;

  mechanic.location = {
    type: 'Point',
    coordinates: [longitude, latitude],
  };

  await mechanic.save();

  return {
    latitude,
    longitude,
    location: mechanic.location,
  };
};

export const getMechanicLocationService = async (id: string) => {
  const mechanic = await Mechanic.findById(id).select('location name email mobile');
  if (!mechanic) {
    throw new AppError('Mechanic not found', 404);
  }

  const coordinates = mechanic.location?.coordinates || [0, 0];
  const [longitude, latitude] = coordinates;
  const isSet = coordinates[0] !== 0 || coordinates[1] !== 0;

  return {
    latitude: isSet ? latitude : null,
    longitude: isSet ? longitude : null,
    location: isSet ? mechanic.location : null,
  };
};

export const getNearbyMechanicsService = async (options: {
  lat: number;
  lng: number;
  radius?: number;
}) => {
  const { lat, lng, radius = 5000 } = options;

  const mechanics = await Mechanic.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: radius,
      },
    },
    status: { $ne: 'inactive' },
  })
    .select('-password')
    .lean();

  return mechanics.map((m: any) => {
    const coords = m.location?.coordinates || [0, 0];
    return {
      ...m,
      latitude: coords[1],
      longitude: coords[0],
    };
  });
};

export const acceptTermsService = async (mechanicId: string, version?: string) => {
  const mechanic = await Mechanic.findById(mechanicId);
  if (!mechanic) {
    throw new AppError('Mechanic not found', 404);
  }

  let resolvedVersion = version;
  if (!resolvedVersion) {
    const TermsModel = (await import('../terms/terms.model')).default;
    const activeTerms = await TermsModel.findOne({ status: 'published', isDeleted: { $ne: true } }).lean();
    resolvedVersion = activeTerms?.version || '1.0';
  }

  const updated = await Mechanic.findByIdAndUpdate(
    mechanicId,
    {
      $set: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: resolvedVersion,
      },
    },
    { new: true }
  ).select('-password').lean();

  return {
    termsAccepted: true,
    termsAcceptedAt: updated?.termsAcceptedAt,
    termsVersion: updated?.termsVersion,
  };
};

