import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth if Supabase is not configured (e.g. during Playwright tests)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    return supabaseResponse
  }

  // TODO: Add RBAC logic here utilizing the `approved_staff` table from database
  const { data: staffData } = await supabase
    .from('approved_staff')
    .select('role, is_active')
    .eq('email', user.email)
    .single()

  if (!staffData || !staffData.is_active) {
    // Force logout or redirect to login if not approved staff
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const role = staffData.role
  const path = request.nextUrl.pathname

  // Basic RBAC
  if (role === 'OPERATIONS') {
    if (path.startsWith('/command-center') || path.startsWith('/bugs') || path.startsWith('/exceptions') || path.startsWith('/pilot') && !path.startsWith('/pilot/order-desk')) {
      const url = request.nextUrl.clone()
      url.pathname = '/pilot/order-desk'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
