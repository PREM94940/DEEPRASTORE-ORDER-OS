# Route Security & Authentication Matrix

## Executive Summary
This document outlines the findings of Phase 1 (Route Security Audit) and Phase 2 (Authentication Audit) for the Deeprastore Order OS.

The audit revealed severe security flaws, including explicit middleware bypasses, missing layout-level protections, and an entirely unprotected secondary application (`apps/admin-portal`).

## Route Access Matrix

| Route | App Context | Public | Auth Required | Role Required | Actual Behavior |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `/` | `web` | No | Yes | Active Staff | Redirects unauthenticated users to `/login`. Authenticated users verified against `approved_staff` table. |
| `/login` | `web` | Yes | No | None | Publicly accessible form. Submits via Server Action. |
| `/order` | `web` | Yes | No | None | Explicitly excluded from unauthenticated redirect in `updateSession`. However, if an *authenticated* non-staff customer accesses it, they are erroneously redirected to `/login`. |
| `/track` | `web` | Yes | No | None | Same behavior as `/order`. |
| `/track/[token]` | `web` | Yes | No | None | Same behavior as `/order`. |
| `/intake` | `web` | No | Yes | Active Staff | Protected by middleware. Redirects to `/login` for anonymous users. |
| `/pilot` | `web` | No | Yes | Active Staff | Middleware enforces auth. If user has role `OPERATIONS`, they are forcibly redirected to `/pilot/order-desk`. |
| `/pilot/order-desk` | `web` | **Yes** | **No** | None | **CRITICAL VULNERABILITY**: Explicitly bypassed in Next.js `middleware.ts` `matcher` config AND the `updateSession` logic. Fully accessible to anonymous users. |
| `/pilot/monitoring` | `web` | **Yes** | **No** | None | **CRITICAL VULNERABILITY**: Bypassed in both `matcher` and `updateSession`. Fully accessible to anonymous users. |
| `/payments` | `web` | No | Yes | Active Staff | Protected by middleware. |
| `/dispatch` | `web` | No | Yes | Active Staff | Protected by middleware. |
| `/reports` | `web` | No | Yes | Active Staff | Protected by middleware. |
| `/settings` | `web` | No | Yes | Active Staff | Protected by middleware. |
| `/support` | `web` | No | Yes | Active Staff | Protected by middleware. `(admin)/layout.tsx` also runs a secondary active-staff check. |
| `/command-center` | `web` | No | Yes | Admin/Active | Middleware enforces auth and redirects `OPERATIONS` users to `/pilot/order-desk`. `(admin)/layout.tsx` verifies active staff status. |
| `/*` (Admin Portal) | `admin-portal` | **Yes** | **No** | None | **CRITICAL VULNERABILITY**: The `admin-portal` app lacks `middleware.ts` and layout auth checks. Direct URLs (e.g., `/operations`) are entirely public. The `/login` page is a mock that just routes to `/orders` without auth. |

## Forensic Questions Addressed

### Can an anonymous user access staff pages?
**Yes.** Anonymous users can directly access `/pilot/order-desk` and `/pilot/monitoring` because they are explicitly excluded from the Next.js middleware `matcher` regex in `apps/web/middleware.ts` (marked `// TEST BYPASS`). 
Furthermore, the entirety of the `apps/admin-portal` application has absolutely no server-side authentication or middleware. Any anonymous user can directly type paths like `/operations` to view the admin panel.

### Can staff pages be opened from cached sessions?
**Yes.** Security checks for `apps/web` are implemented *exclusively* in `middleware.ts`. There are no layout-level or page-level `supabase.auth.getUser()` validations inside the `(staff)` route group (with the exception of `(admin)/layout.tsx`). Because Next.js client-side navigations (via router cache) bypass middleware, a user with an expired session or a cached UI payload can open and interact with staff pages until a hard refresh or server action forces a revalidation.

### Can admin pages open without login?
**Yes.** The `apps/admin-portal` Next.js application has no `middleware.ts` and no server-side authentication in its layouts or pages. The root route (`/`) redirects to `/login`, but the login page contains a hardcoded `<Link href="/orders">` on the "Authenticate" button that completely bypasses Supabase auth. Any direct navigation to its internal routes (e.g., `/operations`) renders immediately without verifying session state.

### Why does desktop open admin panel while mobile asks login?
This happens due to two primary factors:
1. **Next.js Router Cache Bypassing Middleware**: Desktop users relying on client-side navigation (e.g., navigating via the browser's back button or cached desktop PWA states) trigger the Next.js router cache. This serves the cached staff layout payload without executing the server-side `middleware.ts`. Mobile users typically execute fresh server requests (hard page loads), which trigger `middleware.ts` and successfully redirect unauthenticated sessions to `/login`.
2. **Persistent Cookies vs Temporary Views**: Desktop browsers retain Supabase session cookies aggressively across sessions. If a mobile user accesses the site through a temporary web-view (like Instagram or WhatsApp in-app browsers) or drops the cookie, the middleware correctly kicks them to `/login`. Desktop users retain their state or hit the client cache, seamlessly entering the admin panel.
