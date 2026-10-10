import Mechanic, { IMechanic, IKycDocument } from '../../schemas/mechanic.schema';
import Job from '../../schemas/job.schema';
import AppError from '../../utils/appError';
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

export const createMechanicService = async (mechanicData: Partial<IMechanic>) => {
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

  // Mechanic status is active/verified ONLY when kycStatus is 'approved'.
  // If kycStatus is 'pending', mechanic status MUST be 'pending'.
  const initialKycStatus = mechanicData.kycStatus === 'approved' ? 'approved' : 'pending';
  const initialStatus = initialKycStatus === 'approved' ? (mechanicData.status || 'active') : 'pending';
  const initialRadius = typeof mechanicData.radius === 'number' && mechanicData.radius > 0 ? mechanicData.radius : 5;

  const processedKyc: IKycDocument[] = (mechanicData.kyc || []).map((doc) => ({
    ...doc,
    isVerified: initialKycStatus === 'approved',
  }));

  const mechanic = new Mechanic({
    ...mechanicData,
    kyc: processedKyc,
    kycStatus: initialKycStatus,
    status: initialStatus,
    radius: initialRadius,
  });

  await mechanic.save();

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

export const updateMechanicService = async (id: string, updateData: Partial<IMechanic>) => {
  const mechanic = await Mechanic.findById(id);

  if (!mechanic) {
    throw new AppError('Mechanic not found', 404);
  }

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

  // Mechanic status is active/verified ONLY when kycStatus is 'approved'.
  // If kycStatus is 'pending', mechanic status MUST be 'pending'.
  const targetKycStatus = updateData.kycStatus || mechanic.kycStatus || 'pending';

  if (targetKycStatus === 'approved') {
    mechanic.kycStatus = 'approved';
    updateData.kycStatus = 'approved';
    if (updateData.kyc && updateData.kyc.length > 0) {
      updateData.kyc = updateData.kyc.map((doc) => ({
        ...doc,
        isVerified: true,
      }));
    } else if (mechanic.kyc && mechanic.kyc.length > 0) {
      mechanic.kyc = mechanic.kyc.map((doc) => ({
        ...doc,
        isVerified: true,
      }));
    }
    if (mechanic.status === 'pending') {
      updateData.status = updateData.status && updateData.status !== 'pending' ? updateData.status : 'active';
    }
  } else {
    mechanic.kycStatus = targetKycStatus;
    updateData.kycStatus = targetKycStatus;
    updateData.status = 'pending';
    if (updateData.kyc && updateData.kyc.length > 0) {
      updateData.kyc = updateData.kyc.map((doc) => ({
        ...doc,
        isVerified: false,
      }));
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
  kycDocs: IKycDocument[],
  targetKycStatus?: 'pending' | 'approved' | 'rejected'
) => {
  const mechanic = await Mechanic.findById(id);

  if (!mechanic) {
    throw new AppError('Mechanic not found', 404);
  }

  const kycStatus = targetKycStatus || mechanic.kycStatus || 'pending';

  const processedKyc: IKycDocument[] = kycDocs.map((doc) => ({
    ...doc,
    isVerified: kycStatus === 'approved',
  }));

  mechanic.kyc = processedKyc;
  mechanic.kycStatus = kycStatus;

  // Mechanic status is active/approved ONLY when kycStatus is 'approved'. If 'pending', status is 'pending'.
  if (kycStatus === 'approved') {
    mechanic.status = 'active';
  } else {
    mechanic.status = 'pending';
  }

  await mechanic.save();

  const mechanicObj = mechanic.toObject();
  delete mechanicObj.password;

  return {
    message:
      kycStatus === 'approved'
        ? 'KYC documents approved. Mechanic account is now active.'
        : 'KYC documents submitted successfully. Verification status is pending review.',
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
