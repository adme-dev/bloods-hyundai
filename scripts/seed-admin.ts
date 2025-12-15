/**
 * Seed Admin User Script
 * 
 * Creates the first admin user for Sale Hyundai
 * Run with: npx tsx scripts/seed-admin.ts
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../server/database/schema';
import { dealers, users } from '../server/database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  console.error('❌ NEON_DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...\n');
    
    // Find Sale Hyundai dealer
    const [dealer] = await db
      .select()
      .from(dealers)
      .where(eq(dealers.slug, 'sale-hyundai'))
      .limit(1);
    
    if (!dealer) {
      console.error('❌ Sale Hyundai dealer not found in database');
      process.exit(1);
    }
    
    console.log(`✓ Found dealer: ${dealer.name} (${dealer.id})`);
    
    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, 'admin@salehyundai.com.au'),
    });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      console.log('\n💡 To reset password, delete the user and run this script again');
      process.exit(0);
    }
    
    // Hash password
    const password = 'Admin123!'; // Change this in production!
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create admin user
    const [admin] = await db
      .insert(users)
      .values({
        dealerId: dealer.id,
        email: 'admin@salehyundai.com.au',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'dealer_admin',
        department: 'management',
        isActive: true,
        emailVerified: true,
      })
      .returning();
    
    console.log('\n✅ Admin user created successfully!\n');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', `${admin.firstName} ${admin.lastName}`);
    console.log('🎭 Role:', admin.role);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('🌐 Login at: http://localhost:3000/admin/login\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();






