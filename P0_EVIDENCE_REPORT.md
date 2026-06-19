# P0 Evidence Report

This report provides hard evidence for the critical vulnerabilities identified during the Forensic Reality Audit. No code changes have been made.

## A. Middleware Bypass (Public Access to Staff Pages)

**Claim:** Anonymous users can access the staff pages `/pilot/order-desk` and `/pilot/monitoring` without logging in.

1. **Exact File Path:** `d:\DEEPRASTORE ORDER OS\apps\web\middleware.ts`
2. **Code Snippet:**
```typescript
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - pilot/monitoring (TEST BYPASS)
     * - pilot/order-desk (TEST BYPASS)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|pilot/monitoring|pilot/order-desk).*)',
  ],
}
```
3. **Line Numbers:** 8-21
4. **Reproduction Steps:**
   - Open an incognito window.
   - Navigate to `https://deeprastore-order-os.vercel.app/pilot/order-desk`.
   - Observe that the page loads completely, displaying the order desk, instead of redirecting to `/login`.

---

**Claim:** The Supabase session verifier also explicitly skips authentication for these routes.

1. **Exact File Path:** `d:\DEEPRASTORE ORDER OS\apps\web\utils\supabase\middleware.ts`
2. **Code Snippet:**
```typescript
  if (!user) {
    if (
      !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/order') &&
      !request.nextUrl.pathname.startsWith('/track') &&
      !request.nextUrl.pathname.startsWith('/api/upload') &&
      !request.nextUrl.pathname.startsWith('/pilot/monitoring') &&
      !request.nextUrl.pathname.startsWith('/pilot/order-desk')
    ) {
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
```
3. **Line Numbers:** 43-57
4. **Reproduction Steps:** See above. The middleware explicitly checks if the URL starts with `pilot/order-desk` and skips the redirect to `/login` if true.

---

## B. Server Action Exposure (Unauthenticated Data Leak & Writes)

**Claim:** Critical server actions like `approvePaymentAction` lack any authentication or authorization checks.

1. **Exact File Path:** `d:\DEEPRASTORE ORDER OS\apps\web\app\(staff)\actions\payments.ts`
2. **Code Snippet:**
```typescript
export async function approvePaymentAction(orderId: string, paymentId: string, staffName: string) {
  try {
    await db.transaction(async (tx) => {
      // 1. Update the order
      await tx.update(orders)
        .set({
          paymentStatus: 'VERIFIED',
          status: 'CONFIRMED',
          verificationStaff: staffName,
          verificationTime: new Date(),
          updatedAt: new Date()
        })
        .where(and(eq(orders.id, orderId), eq(orders.tenantId, MOCK_TENANT_ID)));
```
3. **Line Numbers:** 10-22
4. **Reproduction Steps:**
   - Construct an HTTP POST request to the Next.js server action endpoint for `approvePaymentAction`.
   - Pass a valid `orderId` and a spoofed `staffName`.
   - Do NOT include a session cookie or auth token in the headers.
   - The server will execute the database transaction and mark the payment as verified, bypassing the UI and the Production Gatekeeper.

*(This same flaw applies to `updateEnquiryStatusAction` in `order-desk.ts` and `fetchCustomerOrdersAction` in `customer.ts`.)*
