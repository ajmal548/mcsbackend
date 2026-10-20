import { ITermsLean } from './terms.model';
import { ITermsAuditLogLean } from './termsAuditLog.model';
import { TermsResponseDTO, TermsAuditLogResponseDTO } from './terms.schema';

/**
 * Transforms a lean Terms document into a public / admin client DTO.
 */
export const toTermsResponseDTO = (terms: ITermsLean): TermsResponseDTO => {
  return {
    id: terms._id.toString(),
    title: terms.title,
    content: terms.content,
    version: terms.version,
    status: terms.status,
    effectiveDate: terms.effectiveDate instanceof Date ? terms.effectiveDate.toISOString() : new Date(terms.effectiveDate).toISOString(),
    createdBy: terms.createdBy,
    updatedBy: terms.updatedBy,
    deletedBy: terms.deletedBy,
    createdAt: terms.createdAt instanceof Date ? terms.createdAt.toISOString() : new Date(terms.createdAt).toISOString(),
    updatedAt: terms.updatedAt instanceof Date ? terms.updatedAt.toISOString() : new Date(terms.updatedAt).toISOString(),
  };
};

export const toTermsResponseDTOList = (items: ITermsLean[]): TermsResponseDTO[] => {
  return items.map(toTermsResponseDTO);
};

/**
 * Transforms a lean TermsAuditLog document into an audit client DTO.
 */
export const toTermsAuditLogResponseDTO = (log: ITermsAuditLogLean): TermsAuditLogResponseDTO => {
  return {
    id: log._id.toString(),
    action: log.action,
    termsId: log.termsId.toString(),
    adminId: log.adminId ? log.adminId.toString() : undefined,
    adminEmail: log.adminEmail,
    mechanicId: log.mechanicId ? log.mechanicId.toString() : undefined,
    version: log.version,
    ip: log.ip,
    timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : new Date(log.timestamp).toISOString(),
    changes: log.changes,
    createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : new Date(log.createdAt).toISOString(),
  };
};

export const toTermsAuditLogResponseDTOList = (items: ITermsAuditLogLean[]): TermsAuditLogResponseDTO[] => {
  return items.map(toTermsAuditLogResponseDTO);
};
