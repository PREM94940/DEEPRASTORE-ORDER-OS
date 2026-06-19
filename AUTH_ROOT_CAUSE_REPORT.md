# Auth Root Cause & GitHub Failure Report

This report explains the exact root cause of the Desktop vs. Mobile login discrepancy and the GitHub commit failure indicator.

## D. Desktop vs Mobile Login Difference

**Claim:** Why does desktop open the admin panel while mobile asks for a login?

**Root Cause:** A combination of the **Next.js Client-Side Router Cache** bypassing middleware, combined with **Persistent Supabase Cookies**.

1. **The Middleware Bypass (Client-Side Navigation)**
   Security checks in `apps/web` are implemented *exclusively* in `middleware.ts`. There are no layout-level or page-level `supabase.auth.getUser()` validations inside the `(staff)` route group itself. 
   When navigating on Desktop using client-side links (e.g., clicking a sidebar button or the browser back button), the Next.js router cache serves the cached UI payload *without executing the server-side `middleware.ts`*. 

2. **Cookie Persistence**
   Desktop browsers aggressively retain the Supabase session cookie (`sb-[ref]-auth-token`) across sessions. If you had logged in during a previous development session, that cookie was still valid.
   Mobile webviews (like clicking a link from WhatsApp/Instagram) do not share cookies with your main mobile browser (Safari/Chrome). Thus, the mobile device executes a fresh server request, triggers `middleware.ts`, realizes there is no session cookie, and correctly redirects to `/login`.

3. **Unprotected Secondary App**
   Furthermore, if you accessed `admin-portal.deeprastore.com` instead of the main `web` app, the entire `apps/admin-portal` application lacks a `middleware.ts` file. Its routes (like `/operations`) are fully public and will load immediately on any device, but the fake login page routes directly to it via a `<Link>` tag without any auth.

---

## E. GitHub Failure

**Claim:** Why did GitHub show `x 1/3` when the local build passed?

**Root Cause:** The repository does not actually have any GitHub Actions (`.github/workflows` does not exist). The red `x 1/3` check originated from **Vercel's GitHub App Integration**.

1. **The Ghost Projects:** Vercel was attempting to build three projects on every commit: the new `web` app, and the stale `admin-portal` and `storefront` projects. You deleted the stale projects from Vercel, reducing the checks from 3 to 1.
2. **Exact Error:** The remaining `web` app build failed on Vercel because `apps/web/next.config.mjs` contained an invalid configuration:
   ```javascript
   // Invalid configuration that crashed the Vercel build
   experimental: {
     turbopack: {
       root: path.join(__dirname, '../../'),
     },
   }
   ```
3. **Resolution:** This invalid `turbopack` flag crashed `next build` in CI, causing the red `x 1/3`. It was fixed and removed in commit `1d4556c`. Production is now healthy.
