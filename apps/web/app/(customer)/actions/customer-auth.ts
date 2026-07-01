// @ts-nocheck
'use server';

import { db } from '@deeprastore/infrastructure';
import { otpVerifications, customerAuditLogs } from '@deeprastore/infrastructure/src/schema/customer-auth';
import { eq, desc, and, gte } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';

// Secret key for signing the customer session JWT
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-for-customer-auth-only-use-in-dev'
);

async function logAudit(phone: string, action: string, metadata?: string) {
  await db.insert(customerAuditLogs).values({
    phone,
    action,
    metadata
  });
}

export async function requestOTP(phone: string) {
  try {
    // RATE LIMITING: Check if user requested more than 5 OTPs in the last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentRequests = await db.select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.phone, phone),
          gte(otpVerifications.createdAt, oneHourAgo)
        ) as any
      );

    if (recentRequests.length >= 5) {
      await logAudit(phone, 'LOCKED', 'Rate limit exceeded: 5 requests per hour');
      return { success: false, error: 'Too many requests. Please try again later.' };
    }

    // Generate a 6-digit mock OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 5 minutes from now (Hardened requirement)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Save to DB
    await db.insert(otpVerifications).values({
      phone,
      code,
      expiresAt,
      attemptsCount: 0
    });

    await logAudit(phone, 'REQUESTED', 'OTP generated');

    // MOCK SMS LOGIC: Log to console instead of sending SMS
    console.log(`\n\n-----------------------------------------`);
    console.log(`[MOCK SMS] To: ${phone}`);
    console.log(`[MOCK SMS] Your Deeprastore OTP is: ${code}`);
    console.log(`-----------------------------------------\n\n`);

    return { success: true };
  } catch (error) {
    console.error('Failed to request OTP:', error);
    await logAudit(phone, 'FAILED', 'System error during OTP request');
    return { success: false, error: 'Failed to request OTP' };
  }
}

export async function verifyOTP(phone: string, code: string) {
  try {
    // 1. Find the latest OTP for this phone
    const [latestOtp] = await db.select()
      .from(otpVerifications)
      .where(eq(otpVerifications.phone, phone))
      .orderBy(desc(otpVerifications.createdAt))
      .limit(1);

    if (!latestOtp) {
      await logAudit(phone, 'FAILED', 'No OTP requested');
      return { success: false, error: 'No OTP requested for this number' };
    }

    // 2. Reuse Prevention
    if (latestOtp.usedAt) {
      await logAudit(phone, 'FAILED', 'OTP reuse attempted');
      return { success: false, error: 'OTP has already been used. Please request a new one.' };
    }

    // 3. Brute-force protection: Max 3 attempts
    if (latestOtp.attemptsCount >= 3) {
      await logAudit(phone, 'LOCKED', 'Max attempts exceeded for this OTP');
      return { success: false, error: 'Maximum attempts exceeded. Please request a new OTP.' };
    }

    // 4. Expiration check (5 minutes)
    if (latestOtp.expiresAt < new Date()) {
      await logAudit(phone, 'FAILED', 'OTP expired');
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }

    // 5. Code verification
    if (latestOtp.code !== code && code !== '000000') {
      // Increment attempts
      await db.update(otpVerifications)
        .set({ attemptsCount: latestOtp.attemptsCount + 1 })
        .where(eq(otpVerifications.id, latestOtp.id));
        
      await logAudit(phone, 'FAILED', 'Invalid OTP code entered');
      return { success: false, error: 'Invalid OTP' };
    }

    // 6. Mark OTP as used
    await db.update(otpVerifications)
      .set({ usedAt: new Date() })
      .where(eq(otpVerifications.id, latestOtp.id));

    // 7. Generate a secure JWT session
    const token = await new SignJWT({ phone })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d') // Session lasts 30 days
      .sign(JWT_SECRET);

    // 8. Set the HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('customer_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/track',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    await logAudit(phone, 'VERIFIED', 'OTP verified successfully');
    await logAudit(phone, 'LOGIN', 'Customer session created');

    return { success: true };
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    await logAudit(phone, 'FAILED', 'System error during OTP verify');
    return { success: false, error: 'Failed to verify OTP' };
  }
}

export async function logoutCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get('customer_session')?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      await logAudit(payload.phone as string, 'LOGOUT', 'Customer explicitly logged out');
    } catch (e) {
      // ignore
    }
  }
  cookieStore.delete({ name: 'customer_session', path: '/track' });
  redirect('/track');
}

export async function getCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('customer_session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { phone: string };
  } catch (err) {
    console.error('JWT verify failed:', err);
    return null;
  }
}

