import mongoose, { ClientSession, Types } from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import { NotFoundError, ConflictError, AppError } from '../../utils/appError';
import { termsRepository, TermsRepository } from './terms.repository';
import {
  toTermsResponseDTO,
  toTermsResponseDTOList,
  toTermsAuditLogResponseDTO,
  toTermsAuditLogResponseDTOList,
} from './terms.mapper';
import {
  CreateTermsDTO,
  UpdateTermsDTO,
  GetTermsQueryDTO,
  GetTermsAuditQueryDTO,
  TermsResponseDTO,
  TermsAuditLogResponseDTO,
  CreateTermsResponseDTO,
  UpdateTermsResponseDTO,
  DeleteTermsResponseDTO,
} from './terms.schema';
import { PaginationMeta } from '../../utils/responseHandlers';
import { ITermsAuditChanges } from './termsAuditLog.model';

export interface AdminContext {
  adminId: string | Types.ObjectId;
  adminEmail: string;
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'p',
    'a',
    'ul',
    'ol',
    'nl',
    'li',
    'b',
    'i',
    'strong',
    'em',
    'strike',
    'code',
    'hr',
    'br',
    'div',
    'table',
    'thead',
    'caption',
    'tbody',
    'tr',
    'th',
    'td',
    'pre',
    'span',
    'u',
    'sub',
    'sup',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    '*': ['style', 'class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};

export class TermsService {
  constructor(private readonly repository: TermsRepository = termsRepository) {}

  /**
   * Sanitizes rich text / HTML content to prevent XSS.
   */
  public sanitizeContent(rawHtml: string): string {
    return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
  }

  /**
   * Runs an operation inside a Mongo transaction if supported;
   * gracefully falls back to non-transactional mode for standalone local MongoDB.
   */
  private async executeWithTransaction<T>(
    operation: (session?: ClientSession) => Promise<T>
  ): Promise<T> {
    let session: ClientSession | null = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (err: any) {
      if (session && session.inTransaction()) {
        try {
          await session.abortTransaction();
        } catch (_) {
          // Ignore abort errors
        }
      }
      // If standalone deployment does not support transactions, retry without session
      if (
        err?.message?.includes('replica set') ||
        err?.message?.includes('Transaction numbers are only allowed')
      ) {
        return operation(undefined);
      }
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  /**
   * Admin: Creates a new Terms & Conditions record.
   * If published, archives any previously published record and creates audit logs.
   */
  async createTerms(
    dto: CreateTermsDTO,
    adminContext: AdminContext
  ): Promise<CreateTermsResponseDTO> {
    // 1. Check version uniqueness among non-deleted documents
    const existing = await this.repository.findByVersion(dto.version);
    if (existing) {
      throw new ConflictError(
        `Terms & Conditions version '${dto.version}' already exists`,
        'TERMS_VERSION_EXISTS'
      );
    }

    const sanitized = this.sanitizeContent(dto.content);
    const targetStatus = dto.status || 'draft';
    const effectiveDate = dto.effectiveDate ? new Date(dto.effectiveDate) : new Date();

    return this.executeWithTransaction(async (session) => {
      // 2. If status is published, archive any active published terms first
      let archivedIds: string[] = [];
      if (targetStatus === 'published') {
        archivedIds = await this.repository.archivePreviousPublished(
          '',
          adminContext.adminEmail,
          session
        );
      }

      // 3. Create terms document
      const created = await this.repository.create(
        {
          title: dto.title,
          content: sanitized,
          version: dto.version,
          status: targetStatus,
          effectiveDate,
          createdBy: adminContext.adminEmail,
          isDeleted: false,
        },
        session
      );

      // 4. Write CREATE audit log
      await this.repository.createAuditLog(
        {
          action: 'CREATE',
          termsId: created._id,
          adminId: new Types.ObjectId(adminContext.adminId),
          adminEmail: adminContext.adminEmail,
          timestamp: new Date(),
        },
        session
      );

      // 5. If created as published, write PUBLISH audit log
      if (targetStatus === 'published') {
        await this.repository.createAuditLog(
          {
            action: 'PUBLISH',
            termsId: created._id,
            adminId: new Types.ObjectId(adminContext.adminId),
            adminEmail: adminContext.adminEmail,
            timestamp: new Date(),
          },
          session
        );
      }

      return {
        termsCreated: true,
        termsId: created._id.toString(),
        status: created.status,
      };
    });
  }

  /**
   * Admin: Updates an existing Terms & Conditions record.
   * Tracks changed fields in before/after snapshot for the audit log.
   */
  async updateTerms(
    id: string,
    dto: UpdateTermsDTO,
    adminContext: AdminContext
  ): Promise<UpdateTermsResponseDTO> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Terms & Conditions not found', 'TERMS_NOT_FOUND');
    }

    // Version uniqueness check if version is changing
    if (dto.version && dto.version !== existing.version) {
      const duplicate = await this.repository.findByVersion(dto.version, id);
      if (duplicate) {
        throw new ConflictError(
          `Terms & Conditions version '${dto.version}' already exists`,
          'TERMS_VERSION_EXISTS'
        );
      }
    }

    // Prepare update fields & detect changes
    const updateFields: Record<string, any> = {
      updatedBy: adminContext.adminEmail,
    };
    const changes: ITermsAuditChanges = {};

    if (dto.title !== undefined && dto.title !== existing.title) {
      updateFields.title = dto.title;
      changes.title = { before: existing.title, after: dto.title };
    }

    if (dto.content !== undefined) {
      const sanitized = this.sanitizeContent(dto.content);
      if (sanitized !== existing.content) {
        updateFields.content = sanitized;
        changes.content = { before: existing.content, after: sanitized };
      }
    }

    if (dto.version !== undefined && dto.version !== existing.version) {
      updateFields.version = dto.version;
      changes.version = { before: existing.version, after: dto.version };
    }

    if (dto.status !== undefined && dto.status !== existing.status) {
      updateFields.status = dto.status;
      changes.status = { before: existing.status, after: dto.status };
    }

    if (dto.effectiveDate !== undefined) {
      const newEff = new Date(dto.effectiveDate);
      const oldEff = new Date(existing.effectiveDate);
      if (newEff.getTime() !== oldEff.getTime()) {
        updateFields.effectiveDate = newEff;
        changes.effectiveDate = {
          before: oldEff.toISOString(),
          after: newEff.toISOString(),
        };
      }
    }

    const isPublishing = dto.status === 'published' && existing.status !== 'published';

    return this.executeWithTransaction(async (session) => {
      // If publishing, archive other published versions
      if (isPublishing) {
        await this.repository.archivePreviousPublished(
          id,
          adminContext.adminEmail,
          session
        );
      }

      await this.repository.atomicUpdate(id, updateFields, session);

      // Write PUBLISH audit entry if published
      if (isPublishing) {
        await this.repository.createAuditLog(
          {
            action: 'PUBLISH',
            termsId: existing._id,
            adminId: new Types.ObjectId(adminContext.adminId),
            adminEmail: adminContext.adminEmail,
            timestamp: new Date(),
            changes: Object.keys(changes).length > 0 ? changes : undefined,
          },
          session
        );
      } else if (Object.keys(changes).length > 0) {
        // Write UPDATE audit entry
        await this.repository.createAuditLog(
          {
            action: 'UPDATE',
            termsId: existing._id,
            adminId: new Types.ObjectId(adminContext.adminId),
            adminEmail: adminContext.adminEmail,
            timestamp: new Date(),
            changes,
          },
          session
        );
      }

      return {
        termsUpdated: true,
        termsId: id,
        status: (updateFields.status || existing.status) as any,
      };
    });
  }

  /**
   * Admin: Soft deletes a Terms & Conditions record.
   */
  async deleteTerms(
    id: string,
    adminContext: AdminContext
  ): Promise<DeleteTermsResponseDTO> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Terms & Conditions not found', 'TERMS_NOT_FOUND');
    }

    return this.executeWithTransaction(async (session) => {
      await this.repository.softDelete(id, adminContext.adminEmail, session);

      await this.repository.createAuditLog(
        {
          action: 'DELETE',
          termsId: existing._id,
          adminId: new Types.ObjectId(adminContext.adminId),
          adminEmail: adminContext.adminEmail,
          timestamp: new Date(),
        },
        session
      );

      return {
        termsDeleted: true,
        termsId: id,
      };
    });
  }

  /**
   * Public: Retrieves currently active published Terms & Conditions.
   */
  async getActiveTerms(): Promise<TermsResponseDTO> {
    const active = await this.repository.findActivePublished();
    if (!active) {
      throw new NotFoundError(
        'No active Terms & Conditions found',
        'NO_ACTIVE_TERMS'
      );
    }
    return toTermsResponseDTO(active);
  }

  /**
   * Admin: Retrieves a single Terms & Conditions document by ID.
   */
  async getTermsById(id: string): Promise<TermsResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundError('Terms & Conditions not found', 'TERMS_NOT_FOUND');
    }
    return toTermsResponseDTO(item);
  }

  /**
   * Admin: Retrieves paginated Terms list with search & status filter.
   */
  async getTermsList(
    query: GetTermsQueryDTO
  ): Promise<{ items: TermsResponseDTO[]; meta: PaginationMeta }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { version: { $regex: query.search, $options: 'i' } },
        { createdBy: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.status) {
      filter.status = query.status;
    }

    const { items, total } = await this.repository.findPaginated(filter, {
      skip,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      items: toTermsResponseDTOList(items),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin: Retrieves audit logs for a specific Terms document.
   */
  async getTermsAuditLogs(
    id: string,
    query: GetTermsAuditQueryDTO
  ): Promise<{ items: TermsAuditLogResponseDTO[]; meta: PaginationMeta }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Invalid terms ID', 'INVALID_ID');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      termsId: new Types.ObjectId(id),
    };

    if (query.action) {
      filter.action = query.action;
    }

    if (query.admin) {
      filter.adminEmail = { $regex: query.admin, $options: 'i' };
    }

    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
    }

    const { items, total } = await this.repository.findAuditLogs(filter, {
      skip,
      limit,
      sort: { timestamp: -1 },
    });

    return {
      items: toTermsAuditLogResponseDTOList(items),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin: Retrieves global audit log across all Terms documents.
   */
  async getGlobalAuditLogs(
    query: GetTermsAuditQueryDTO
  ): Promise<{ items: TermsAuditLogResponseDTO[]; meta: PaginationMeta }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.action) {
      filter.action = query.action;
    }

    if (query.admin) {
      filter.adminEmail = { $regex: query.admin, $options: 'i' };
    }

    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
    }

    const { items, total } = await this.repository.findAuditLogs(filter, {
      skip,
      limit,
      sort: { timestamp: -1 },
    });

    return {
      items: toTermsAuditLogResponseDTOList(items),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const termsService = new TermsService();
export default termsService;
