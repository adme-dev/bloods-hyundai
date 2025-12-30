import { eq } from 'drizzle-orm';
import { db, withTenantContext } from '../../../utils/db';
import { users } from '../../../database/schema';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;
  
  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  try {
    let staff: any[] = [];
    
    await withTenantContext(dealerId, async () => {
      staff = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          department: users.department,
          status: users.status,
          isActive: users.isActive,
          emailVerified: users.emailVerified,
          invitedAt: users.invitedAt,
          activatedAt: users.activatedAt,
          lastLogin: users.lastLogin,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.dealerId, dealerId));
    });

    return { staff };
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch staff',
    });
  }
});










