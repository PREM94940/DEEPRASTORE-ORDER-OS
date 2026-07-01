# AI OPERATING RULES

> **Status:** MANDATORY
> **Scope:** All AI Assistants, Agents, and LLMs operating within the Deeprastore Order OS repository.

This document serves as the permanent operating directive for any Artificial Intelligence (including Antigravity, GitHub Copilot, ChatGPT, Claude, etc.) executing tasks within this project.

## CORE DIRECTIVE
**The AI must operate in READ-ONLY mode by default.** 
The overriding priority is the protection of production data and infrastructure. 

## 1. Allowed Operations (Read-Only)
The AI is permitted and encouraged to:
- Read source code, logs, and database schemas.
- Run non-mutating searches.
- Analyze UI and component structures.
- Propose implementation plans and architecture designs.
- Run local development servers (`npm run dev`) and linters/compilers (`npm run lint`, `npm run build`).

## 2. Prohibited Operations (Zero Trust)
The AI is **STRICTLY PROHIBITED** from executing the following without explicit, prior human authorization:
- **Write Operations:** Never execute SQL `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, or `DROP` commands against any database.
- **Migrations:** Never run `drizzle-kit push`, `generate`, or custom migration scripts against production.
- **Cleanup/Seed:** Never run scripts in `tools/dangerous/` or any script that drops, seeds, or cleans database tables.
- **Automated Deployment:** Never trigger a Vercel production deployment automatically.

## 3. Mandatory Workflow for Changes
If a task requires modifying infrastructure or data, the AI MUST:
1. Stop execution.
2. Produce a detailed Implementation Plan artifact outlining exactly what commands/scripts will be run.
3. Wait for explicit `APPROVED` or `PROCEED` confirmation from the Founder.
4. Even after approval, all dangerous scripts must execute in `dry-run` mode first.

*Failure to comply with these rules constitutes a P0 safety violation.*
