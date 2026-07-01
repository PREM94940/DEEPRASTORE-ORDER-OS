# ENGINEERING RULES

> **Status:** MANDATORY
> **Scope:** All Human Developers and AI Assistants operating within the Deeprastore Order OS repository.

This document is the permanent operating manual for engineering within Deeprastore Order OS.

## 1. Production Integrity
- **Never modify production directly.** All changes must flow through the GitHub repository and Vercel deployments.
- **Never seed production.** Test data must only be injected into Development or Staging environments.
- **Never delete production records.** Operational data (Orders, Customers, Enquiries, Payments) must NEVER be physically deleted from the database. (Soft deletes will be implemented in a future phase).
- **Never bypass Server Actions.** All database interactions must go through the standard application logic.
- **Never run SQL manually on production.** If a database fix is required, it must be scripted, tested on Staging, and run through the official deployment pipeline.

## 2. GitHub Rules
- **No Direct Pushes to Main.** All changes must be submitted via Pull Request.
- **Merge Requirements:** A Pull Request cannot be merged unless:
  - `npm run lint` passes without errors.
  - `npm run typecheck` passes without errors.
  - `npm run build` passes without errors.
  - Playwright Smoke Tests pass.
  - The Pull Request receives at least one approval.

## 3. Database & Migrations
- **Every schema change requires a migration.** You must use `drizzle-kit generate` to create SQL migration files. 
- **Production migrations are automatic or carefully staged.** Never push schema changes directly to production with `drizzle-kit push`.

## 4. Execution of Dangerous Scripts
Any script in the `tools/dangerous/` folder is considered high risk and must require the following checks before execution:
1. `APP_ENV=development`
2. `ALLOW_DANGEROUS_OPERATIONS=true`
3. Interactive confirmation token
4. Repository fingerprint check
5. Database fingerprint check
6. Dry Run preview
7. Second confirmation

*These rules are designed to make accidental data loss architecturally impossible.*
