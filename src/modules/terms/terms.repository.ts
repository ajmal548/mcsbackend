import { Types, ClientSession } from 'mongoose';
import TermsModel, { ITermsLean } from './terms.model';
import TermsAuditLogModel, { ITermsAuditLogLean } from './termsAuditLog.model';

export class TermsRepository {
  /**
   * Find a non-deleted Terms document by ObjectId.
   */
  async findById(id: string, session?: ClientSession): Promise<ITermsLean | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const query = TermsModel.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: { $ne: true },
    }).lean<ITermsLean>();

    if (session) query.session(session);
    return query.exec();
  }

  /**
   * Find currently active published Terms document.
   */
  async findActivePublished(session?: ClientSession): Promise<ITermsLean | null> {
    const query = TermsModel.findOne({
      status: 'published',
      isDeleted: { $ne: true },
    })
      .sort({ effectiveDate: -1, createdAt: -1 })
      .lean<ITermsLean>();

    if (session) query.session(session);
    return query.exec();
  }

  /**
   * Check if a non-deleted Terms document exists with the given version.
   */
  async findByVersion(
    version: string,
    excludeId?: string,
    session?: ClientSession
  ): Promise<ITermsLean | null> {
    const filter: Record<string, any> = {
      version,
      isDeleted: { $ne: true },
    };

    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const query = TermsModel.findOne(filter).lean<ITermsLean>();
    if (session) query.session(session);
    return query.exec();
  }

  /**
   * List non-deleted terms with pagination, search, and status filter.
   */
  async findPaginated(
    filter: Record<string, any>,
    options: { skip: number; limit: number; sort?: Record<string, 1 | -1> }
  ): Promise<{ items: ITermsLean[]; total: number }> {
    const queryFilter = {
      ...filter,
      isDeleted: { $ne: true },
    };

    const [items, total] = await Promise.all([
      TermsModel.find(queryFilter)
        .sort(options.sort || { createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .lean<ITermsLean[]>()
        .exec(),
      TermsModel.countDocuments(queryFilter).exec(),
    ]);

    return { items, total };
  }

  /**
   * Create a new Terms document.
   */
  async create(
    data: Partial<ITermsLean>,
    session?: ClientSession
  ): Promise<ITermsLean> {
    const docs = await TermsModel.create([data], { session });
    return docs[0].toObject<ITermsLean>();
  }

  /**
   * Atomic update of a Terms document.
   */
  async atomicUpdate(
    id: string,
    updateFields: Record<string, any>,
    session?: ClientSession
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const query = TermsModel.updateOne(
      { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
      { $set: updateFields }
    );

    if (session) query.session(session);
    const result = await query.exec();
    return result.matchedCount > 0;
  }

  /**
   * Atomically archive all previously published Terms (except a given ID).
   * Returns an array of IDs that were transitioned from published to archived.
   */
  async archivePreviousPublished(
    excludeId: string,
    adminEmail: string,
    session?: ClientSession
  ): Promise<string[]> {
    const filter: Record<string, any> = {
      status: 'published',
      isDeleted: { $ne: true },
    };

    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const activePublishedQuery = TermsModel.find(filter).select('_id').lean();
    if (session) activePublishedQuery.session(session);
    const activePublished = await activePublishedQuery.exec();

    if (activePublished.length === 0) return [];

    const updateQuery = TermsModel.updateMany(filter, {
      $set: {
        status: 'archived',
        updatedBy: adminEmail,
      },
    });

    if (session) updateQuery.session(session);
    await updateQuery.exec();

    return activePublished.map((doc) => doc._id.toString());
  }

  /**
   * Soft delete a Terms document.
   */
  async softDelete(
    id: string,
    deletedBy: string,
    session?: ClientSession
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const query = TermsModel.updateOne(
      { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy,
        },
      }
    );

    if (session) query.session(session);
    const result = await query.exec();
    return result.matchedCount > 0;
  }

  /**
   * Create an append-only audit log entry.
   */
  async createAuditLog(
    auditData: Partial<ITermsAuditLogLean>,
    session?: ClientSession
  ): Promise<ITermsAuditLogLean> {
    const docs = await TermsAuditLogModel.create([auditData], { session });
    return docs[0].toObject<ITermsAuditLogLean>();
  }

  /**
   * Query audit logs with pagination and filters.
   */
  async findAuditLogs(
    filter: Record<string, any>,
    options: { skip: number; limit: number; sort?: Record<string, 1 | -1> }
  ): Promise<{ items: ITermsAuditLogLean[]; total: number }> {
    const [items, total] = await Promise.all([
      TermsAuditLogModel.find(filter)
        .sort(options.sort || { timestamp: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .lean<ITermsAuditLogLean[]>()
        .exec(),
      TermsAuditLogModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }
}

export const termsRepository = new TermsRepository();
export default termsRepository;
