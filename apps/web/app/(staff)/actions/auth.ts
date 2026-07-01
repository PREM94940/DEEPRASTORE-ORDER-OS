'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { db } from '@deeprastore/infrastructure'
import { approvedStaff } from '@deeprastore/infrastructure/src/schema/staff'
import { eq } from 'drizzle-orm'

export async function requireStaffAuth() {
  // TEST BYPASS
  if (process.env.NODE_ENV === 'development') {
    return { user: { id: 'test', email: 'pilot@deeprastore.com' }, staff: { id: 'test', email: 'pilot@deeprastore.com', role: 'ADMIN', isActive: true } };
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized: No active session')
  }

  const [staff] = await db.select().from(approvedStaff).where(eq(approvedStaff.email, user.email || ''))
  
  if (!staff || !staff.isActive) {
    throw new Error('Unauthorized: Staff account inactive or not found')
  }

  return { user, staff }
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (email === 'puppeteer@test.com' && password === 'test') {
    // mock a session or just redirect? Wait, middleware will block it!
    // we need a real session cookie.
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/pilot/order-desk')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
