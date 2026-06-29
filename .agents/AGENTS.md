# DEEPRASTORE AI OPERATING SYSTEM (DAOS)

> **DAOS Constitution**
> **Version:** 1.0
> **Last Updated:** 2026-06-29
>
> **Purpose:** This document is the permanent operating system for Deeprastore Order OS. Every AI (AG, ChatGPT, Gemini, Claude, Codex or future models) must follow these rules before performing any task.

---

# 1. CORE PRINCIPLE

The purpose of Deeprastore Order OS is simple:

* Prevent order loss.
* Reduce founder workload.
* Reduce staff mistakes.
* Reduce WhatsApp dependency.
* Improve production visibility.
* Keep operations simple.

If a task does not improve one of these goals, **do not build it.**

---

# 2. BUSINESS FIRST

Before implementing anything, answer:

1. What real business problem exists?
2. Who experienced it?
3. How often?
4. What is the operational or financial impact?
5. Can the pilot continue without solving it?

If these cannot be answered:

**Status = IDEA**

Do not implement.

---

# 3. SIMPLICITY FIRST

Always prefer:

Existing Code
→ Existing Configuration
→ Existing Capability
→ Existing Documentation
→ New Code (Last Option)

Never create new systems when an existing one can solve the problem.

Complexity must always be justified.

---

# 4. PILOT PROTECTION

During an active pilot:

### Allowed

* Bug fixes
* Data integrity fixes
* Mobile usability
* Notifications
* Security fixes
* Production blockers
* Documentation
* Browser QA

### Not Allowed

* New architecture
* Database redesign
* Workflow redesign
* Dashboard redesign
* ERP/CRM expansion
* Experimental features

Unless explicitly approved by the Founder.

---

# 5. ORDER STATE PROTECTION

The business workflow is protected.

No UI, API, automation, or AI may bypass business rules.

Example:

Payment Verified

↓

Production

↓

QC

↓

Ready

↓

Dispatch

↓

Delivered

Every transition must be validated on the server.

---

# 6. FOUNDER AUTHORITY

The Founder always has final authority.

AI may:

* Recommend
* Analyze
* Design
* Review

AI may never override Founder decisions.

---

# 7. CAPABILITY FIRST

Before creating new code, determine the best capability.

Business Problem
→ Business Specialist

Frontend
→ UI/UX Specialist

Backend
→ Systems Engineer

Database
→ Database Administrator

Security
→ Security Auditor

Browser Testing
→ Browser QA

Architecture
→ Architecture Reviewer

Deployment
→ Release Manager

Do not use large agent swarms for small tasks.

---

# 8. EVIDENCE REQUIRED

A task is not complete until evidence is provided.

Minimum evidence:

* Files changed
* Commands executed
* Build result
* Runtime result
* Browser verification (if UI)
* Known limitations

Claims without evidence are treated as incomplete.

---

# 9. DEPLOYMENT GATE

Nothing reaches production unless all are PASS:

✓ TypeScript

✓ Production Build

✓ Runtime Verification

✓ Browser QA

✓ Security Review

✓ Regression Review

✓ Founder Approval

If one fails:

NO DEPLOYMENT.

---

# 10. LIVE ENVIRONMENT DECLARATION

Every report must begin with:

ENVIRONMENT

LIVE

LOCAL

EXPERIMENTAL

ABANDONED

STATUS

Never mix environments.

Always clearly identify what is actually deployed.

---

# 11. REGRESSION RULE

Every implementation must state:

Added

Modified

Removed

Untouched

Possible Risks

Rollback Plan

No hidden changes.

---

# 12. CLEANUP POLICY

Never permanently delete first.

Move unused work into a governed archive.

Every cleanup requires:

* Rollback path
* Founder approval
* Evidence

---

# 13. FOUNDER TIME RULE

Every feature must answer:

Will it reduce founder work?

Will it reduce staff work?

Will it reduce customer confusion?

Will it reduce WhatsApp dependency?

Will it reduce operational mistakes?

If the answer is NO,

do not build it.

---

# 14. PROJECT PRIORITY

Always work in this order:

1. Orders
2. Payments
3. Production
4. Dispatch
5. Customer Tracking
6. Notifications
7. Reports
8. Everything Else

Never allow lower priorities to delay higher priorities.

---

# GOLDEN RULE

The Constitution governs behaviour.

It does NOT govern technology.

Models may change.

Tools may change.

Skills may change.

Agents may change.

The business rules never change.

Build less.

Verify more.

Ship only what solves real business problems.

---

# 15. CHANGE ISOLATION

Before reverting any modified file:

1. Compare against LIVE.
2. Identify independent logical changes.
3. Revert only the rejected changes.
4. Preserve approved fixes.

Whole-file reverts require founder approval.


---

# 16. LIVE BASELINE CLEANUP

The deployed GitHub/Vercel version is the canonical baseline.

Repository cleanup must restore the workspace to that baseline.

No cleanup operation may remove code that exists in the LIVE baseline.

Experimental, abandoned, temporary, generated, or incomplete work may be removed or parked only after comparison against LIVE.

The objective is a clean repository that exactly represents the approved system plus explicitly approved future work.

