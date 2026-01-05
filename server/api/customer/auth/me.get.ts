import { db } from '../../../utils/db';
import { customers } from '../../../database/schema';
import { eq } from 'drizzle-orm';
import { verifyCustomerToken } from '../../../utils/customer-jwt';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'customer_token');

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  try {
    // Verify token using jose (Cloudflare Workers compatible)
    const decoded = await verifyCustomerToken(token);

    if (decoded.type !== 'customer') {
      throw createError({
        statusCode: 401,
        message: 'Invalid token type',
      });
    }

    const [customer] = await db
      .select({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        address: customers.address,
        suburb: customers.suburb,
        state: customers.state,
        postcode: customers.postcode,
        emailVerified: customers.emailVerified,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(eq(customers.id, decoded.customerId));

    if (!customer) {
      throw createError({
        statusCode: 401,
        message: 'Customer not found',
      });
    }

    return {
      customer,
    };
  } catch (error) {
    // Clear invalid cookie
    deleteCookie(event, 'customer_token');
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token',
    });
  }
});
