import { db } from '../../../utils/db';
import { customers, dealers } from '../../../database/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { resolveDealerSlug } from '../../../utils/tenant';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password, firstName, lastName, phone, dealerSlug } = body;

  // Validation
  if (!email || !password || !firstName || !lastName) {
    throw createError({
      statusCode: 400,
      message: 'Email, password, first name, and last name are required',
    });
  }

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'Password must be at least 8 characters',
    });
  }

  // Get dealer
  const runtimeConfig = useRuntimeConfig();
  const slug = dealerSlug || resolveDealerSlug(event, runtimeConfig.public.dealerSlug || 'blood-hyundai');
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

  // Check if customer already exists
  const [existing] = await db
    .select()
    .from(customers)
    .where(and(
      eq(customers.email, email.toLowerCase()),
      eq(customers.dealerId, dealer.id)
    ));

  if (existing) {
    throw createError({
      statusCode: 400,
      message: 'An account with this email already exists',
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Create customer
  const [customer] = await db
    .insert(customers)
    .values({
      dealerId: dealer.id,
      email: email.toLowerCase(),
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || null,
      verificationToken,
      isActive: true,
      emailVerified: false,
    })
    .returning();

  // Generate JWT
  const config = useRuntimeConfig();
  const accessToken = jwt.sign(
    {
      customerId: customer.id,
      dealerId: dealer.id,
      email: customer.email,
      type: 'customer',
    },
    config.jwtSecret || 'default-secret',
    { expiresIn: '7d' }
  );

  // Set HTTP-only cookie
  setCookie(event, 'customer_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  // TODO: Send verification email

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
