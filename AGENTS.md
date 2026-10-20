# Workspace Rules & Guidelines

Welcome to the MYCARSOL Backend (`mcsbackend`) repository. Any developer or AI coding agent working on this codebase must strictly adhere to the guidelines documented in [`guidelines/`](./guidelines/README.md).

## 1. Clean Code & Function Signatures
- **Max 3 Direct Arguments**: Functions and methods must only accept a maximum of 3 direct arguments. For any additional parameters, optional flags, or contextual objects (such as `session`, `skipNotification`, `userContext`), use a typed options object or single DTO.
- **Explicit Naming**: Use descriptive, domain-aligned names (e.g. `handlePostMechanicVerification`, `validateCategorySlugUniqueness`) rather than generic ambiguous names.
- **Defensive Data Handling**: When accessing nested Mongoose objects or subdocuments, always use `.lean()` on queries or `.toObject()` on document instances to prevent Mongoose internal properties (`$__`, `$__parent`, `_doc`) from leaking.

## 2. Strict Layer Separation
- **Route (`*.routes.ts`)**: Only wires path + middlewares (auth, RBAC, validateRequest) + controller. Zero logic.
- **Controller (`*.controller.ts`)**: Parses input, invokes exactly ONE service method, returns standard envelope via `sendSuccess` or `sendError`. No DB queries, no business rules, wrapped with `asyncHandler`.
- **Service (`*.service.ts`)**: Pure business logic and orchestration. Framework-agnostic (never receive Express `req` / `res`). Throws typed `AppError` subclasses. Manages Mongoose ClientSession transactions.
- **Repository (`*.repository.ts`)**: The ONLY layer that touches Mongoose models. Always returns `.lean()` objects.
- **Model (`*.model.ts`)**: Schemas, indexes, virtuals, and hooks only.
- **Mapper (`*.mapper.ts`)**: Formats DB entities into clean client response DTOs.

## 3. Database & Mongoose Rules
- **Atomic Updates Over `.save()`**: Do not call `findOne()` then `doc.save()` on existing documents. Use direct atomic operations (`updateOne`, `findByIdAndUpdate`) with `$set` to prevent race conditions and lost updates.
- **Sub-schemas**: Extract nested structures into explicit sub-schemas with `{ _id: false }`.
- **Soft Delete & Compound Indexes**: Business entities must support soft delete (`isDeleted: boolean`, `deletedAt: Date`). Indexes must include `partialFilterExpression: { isDeleted: { $ne: true } }` for unique constraints.
- **Money**: Store monetary values in integer minor units (or `Decimal128`), never raw floats.

## 4. DTOs & Standard API Envelopes
- **Zod Validation**: Every endpoint must validate input parameters, query strings, and request bodies using Zod schemas.
- **Standard Envelopes**:
  - Success: `{ "success": true, "message": "...", "data": <Payload>, "meta": { ... } }`
  - Error: `{ "success": false, "message": "...", "code": "...", "errors": [], "requestId": "..." }`
- **Mutation Responses**: Mutation endpoints (create, update, toggle status, delete) must return clean verification boolean flags (`<entity>Created: boolean`, `<entity>Updated: boolean`, `<entity>StatusUpdated: boolean`, `<entity>Deleted: boolean`), never raw Mongoose documents.
