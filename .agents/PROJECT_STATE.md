# DEEPRASTORE: PROJECT STATE

> **Version**: 2026.06.29
> **Updated**: After Browser QA

---

## Workspace Reality
* **Current Branch**: `staging`
* **Current HEAD Commit**: (Uncommitted P1 Fixes + P3 Experimental UI present)
* **Live Deployment Commit**: `076778252cb132f2b0972f809dec22289610c1ed` (Vercel)

## Status
* **Pilot Status**: Active (7-Day Live Pilot in progress)
* **Deployment Status**: Blocked (Awaiting decision on P2/P3 drift)
* **Development Status**: 🔴 **HARD FEATURE FREEZE**

## Priorities & Tracking
* **Current Priorities**: Stabilize local workspace without breaking live pilot. Resolve TS errors.
* **Known Issues**: 
  - `enquiry_items` schema drift exists locally but is unmigrated.
  - Experimental `IntakeNotificationBell` injected into `layout.tsx`.
* **Blockers**: Cannot deploy because experimental features would leak into the live environment.
* **Next Founder Decision**: Decide fate of P2 (Schema) and P3 (Experimental UI) before proceeding to deploy.
