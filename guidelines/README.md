# MYCARSOL Backend Guidelines & Architectural Standards

Welcome to the **MYCARSOL Backend** standards and architectural documentation. This directory outlines the strict production engineering rules for all backend development on this repository.

These guidelines are modeled directly after the proven modular architecture in **`KaartxBackend/guidelines`**, tailored for our **Node.js + Express + TypeScript + Mongoose + Zod** stack.

---

## 📚 Guideline Index

| Guideline Document | Focus Area |
| :--- | :--- |
| **[`project_guidelines.txt`](./project_guidelines.txt)** | Architecture, Module Directory Pattern, Provider Abstraction, Layer Separation, Security, Config, Git |
| **[`dto_guidelines.txt`](./dto_guidelines.txt)** | Zod Request Validation, Response DTOs, Mutation Conventions (`<entity>Created: boolean`), Standard Envelopes |
| **[`schema_guidelines.txt`](./schema_guidelines.txt)** | Mongoose Schemas, Sub-schemas (`_id: false`), Compound Indexes, Soft Deletes, Minor Unit Currency, Virtuals |
| **[`service_guidelines.txt`](./service_guidelines.txt)** | Clean Code, Max 3 Params, Atomic Updates vs `.save()`, Multi-document Transactions, Defensive Lean Queries |

---

## 🏛️ Core Architectural Principles

1. **Code Quality Over Speed**: Never ship hacks, dead code, commented-out code, or unreferenced TODOs.
2. **Strict Layer Separation**:
   $$\text{Route} \longrightarrow \text{Controller} \longrightarrow \text{Service} \longrightarrow \text{Repository} \longrightarrow \text{Model}$$
   * **Route**: Wires path, middleware (Auth, RBAC, Validate), and controller.
   * **Controller**: Parses input, invokes exactly ONE service method, sends standard response envelope.
   * **Service**: Pure business logic, framework-agnostic (no Express `req`/`res`), owns Mongoose transactions.
   * **Repository**: The only layer executing Mongoose operations (`.lean()` by default).
   * **Model**: Schema definitions, indexes, hooks, and virtuals.
   * **Mapper**: Transforms raw DB structures into client-facing response DTOs.
3. **Provider Abstraction Pattern**:
   * Any 3rd party integration (Stripe, Twilio, S3, Cloudinary) must define an interface.
   * Vendor implementations live in `providers/<vendor>.adapter.ts`.
   * Services depend on the interface, never direct vendor SDKs.
4. **Defensive Data Handling & Atomic Updates**:
   * Avoid calling `.save()` on existing records. Use atomic `updateOne` / `findByIdAndUpdate`.
   * Always use `.lean()` on read queries to prevent Mongoose internal property leakage (`$__`, `$__parent`).
   * Money is stored in integer minor units (e.g., cents), never floats.

---

## 🗂️ Module File Structure

Every feature domain resides under `src/modules/<feature>/`:

```
src/modules/<feature>/
  ├── <feature>.routes.ts       # Route endpoints & middleware binding
  ├── <feature>.controller.ts   # Request/response handling & envelope dispatch
  ├── <feature>.service.ts      # Business logic & transaction orchestration
  ├── <feature>.repository.ts   # Mongoose query layer (pure lean objects)
  ├── <feature>.model.ts        # Mongoose schema, compound indexes & virtuals
  ├── <feature>.schema.ts       # Zod schemas for request validation & DTO types
  ├── <feature>.types.ts        # Module TypeScript interfaces
  ├── <feature>.constants.ts    # Enums, status codes, route paths
  ├── <feature>.mapper.ts       # Model to response DTO mapping
  ├── providers/                # Vendor adapters (optional)
  ├── __tests__/                # Colocated unit and integration tests
  └── index.ts                  # Public module exports only
```

---

## ✅ Pre-Task & Pre-PR Verification Checklist

Before opening a PR or completing any feature implementation, verify:

- [ ] Directory and file naming follows kebab-case convention (`<feature>.<layer>.ts`).
- [ ] Layer responsibilities are respected (no DB calls in services, no business logic in controllers/routes).
- [ ] Every request body, param, and query has strict Zod validation.
- [ ] Mutation endpoints return clean boolean flags (`{ <entity>Created: true }`), never raw DB documents.
- [ ] Standard response envelopes are used (`{ success: true, message, data, meta? }`).
- [ ] Functions have $\le 3$ direct arguments (options object used for remaining parameters).
- [ ] All read queries use `.lean()` or `.toObject()`.
- [ ] Atomic updates (`updateOne` with `$set`) are used instead of `doc.save()`.
- [ ] Money stored as integer minor units.
- [ ] Compound indexes created for frequent queries with `partialFilterExpression: { isDeleted: { $ne: true } }`.
- [ ] No `any`, no magic values, no `console.log`.
- [ ] Tests written and passing.
