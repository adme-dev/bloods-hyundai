import { db } from '../../../utils/db';
import { customers, dealers } from '../../../database/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signCustomerToken } from '../../../utils/customer-jwt';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password, dealerSlug } = body;

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required',
    });
  }

  // Get dealer by slug (defaults to sale-hyundai)
  const slug = dealerSlug || 'sale-hyundai';
  const [dealer] = await db
    .select()
    .from(dealers)
    .where(eq(dealers.slug, slug));

  if (!dealer) {
    throw createError({
      statusCode: 400,
      message: 'Invalid dealer',
    });
  }

  // Find customer
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(
      eq(customers.email, email.toLowerCase()),
      eq(customers.dealerId, dealer.id)
    ));

  if (!customer) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  }

  if (!customer.passwordHash) {
    throw createError({
      statusCode: 401,
      message: 'Please set up your password first. Check your email for the setup link.',
    });
  }

  if (!customer.isActive) {
    throw createError({
      statusCode: 401,
      message: 'Your account has been disabled. Please contact us.',
    });
  }

  // Verify password
  const isValid = await bcrypt.compare(password, customer.passwordHash);
  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  }

  // Update last login
  await db
    .update(customers)
    .set({ lastLogin: new Date(), updatedAt: new Date() })
    .where(eq(customers.id, customer.id));

  // Generate JWT using jose (Cloudflare Workers compatible)
  const accessToken = await signCustomerToken({
    customerId: customer.id,
    dealerId: dealer.id,
    email: customer.email,
    type: 'customer',
  });

  // Set HTTP-only cookie
  setCookie(event, 'customer_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return {
    success: true,
    customer: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
    },
  };
});
