/**
 * Seed Routing Rules Script
 *
 * Configures email routing rules for form submissions
 * Run with: npx tsx scripts/seed-routing-rules.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../server/database/schema';
import { dealers } from '../server/database/schema';
import { eq } from 'drizzle-orm';
import type { RoutingRule } from '../server/utils/routing';

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  console.error('❌ NEON_DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

// Email addresses for each form type
const EMAILS = {
  parts: 'bmgparts@bmgroup.com.au',
  fleet: 'bmgparts@bmgroup.com.au',
  contact: 'bmgparts@bmgroup.com.au',
  service: 'bmgservice6@bmgroup.com.au',
  sellCar: ['hyundai@bmgroup.com.au', 'bmgused@bmgroup.com.au', 'bmgreception1@bmgroup.com.au'],
  showroom: 'hyundai@bmgroup.com.au',
  salesNew: 'hyundai@bmgroup.com.au',
  salesDemo: 'hyundai@bmgroup.com.au',
  salesUsed: 'bmgused@bmgroup.com.au',
};

function createRoutingRules(): RoutingRule[] {
  return [
    // Vehicle Enquiries - New
    {
      id: 'vehicle-new',
      name: 'New Vehicle Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'vehicle' },
        { field: 'vehicleInfo.condition', operator: 'equals', value: 'New' },
      ],
      actions: {
        send_to: [EMAILS.salesNew],
        priority: 'high',
      },
    },
    // Vehicle Enquiries - Demo
    {
      id: 'vehicle-demo',
      name: 'Demo Vehicle Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'vehicle' },
        { field: 'vehicleInfo.condition', operator: 'equals', value: 'Demo' },
      ],
      actions: {
        send_to: [EMAILS.salesDemo],
        priority: 'high',
      },
    },
    // Vehicle Enquiries - Used
    {
      id: 'vehicle-used',
      name: 'Used Vehicle Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'vehicle' },
        { field: 'vehicleInfo.condition', operator: 'equals', value: 'Used' },
      ],
      actions: {
        send_to: [EMAILS.salesUsed],
        priority: 'normal',
      },
    },
    // Service Enquiries
    {
      id: 'service',
      name: 'Service Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'service' },
      ],
      actions: {
        send_to: [EMAILS.service],
        priority: 'normal',
      },
    },
    // Sell My Car Enquiries
    {
      id: 'sell-car',
      name: 'Sell My Car Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'sell_car' },
      ],
      actions: {
        send_to: EMAILS.sellCar,
        priority: 'normal',
      },
    },
    // Parts Enquiries
    {
      id: 'parts',
      name: 'Parts Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'parts' },
      ],
      actions: {
        send_to: [EMAILS.parts],
        priority: 'normal',
      },
    },
    // Fleet Enquiries
    {
      id: 'fleet',
      name: 'Fleet Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'fleet' },
      ],
      actions: {
        send_to: [EMAILS.fleet],
        priority: 'normal',
      },
    },
    // Accessories Enquiries (same as parts)
    {
      id: 'accessories',
      name: 'Accessories Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'accessories' },
      ],
      actions: {
        send_to: [EMAILS.parts],
        priority: 'normal',
      },
    },
    // Contact/General Enquiries
    {
      id: 'contact',
      name: 'Contact Form Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'contact' },
      ],
      actions: {
        send_to: [EMAILS.contact],
        priority: 'normal',
      },
    },
    // Test Drive Requests (route to showroom)
    {
      id: 'test-drive',
      name: 'Test Drive Requests',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'test_drive' },
      ],
      actions: {
        send_to: [EMAILS.showroom],
        priority: 'high',
      },
    },
    // Finance Enquiries (route to showroom)
    {
      id: 'finance',
      name: 'Finance Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'finance' },
      ],
      actions: {
        send_to: [EMAILS.showroom],
        priority: 'normal',
      },
    },
    // Special Offers (route to showroom)
    {
      id: 'special-offer',
      name: 'Special Offer Enquiries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'special_offer' },
      ],
      actions: {
        send_to: [EMAILS.showroom],
        priority: 'normal',
      },
    },
    // Catch-all for any other enquiries
    {
      id: 'default',
      name: 'All Other Enquiries',
      enabled: true,
      conditions: [], // No conditions = catch all
      actions: {
        send_to: [EMAILS.contact],
        priority: 'normal',
      },
    },
  ];
}

async function seedRoutingRules() {
  try {
    console.log('🌱 Seeding routing rules...\n');

    // Find dealer
    const [dealer] = await db
      .select()
      .from(dealers)
      .where(eq(dealers.slug, 'bloods-hyundai'))
      .limit(1);

    if (!dealer) {
      console.error('❌ Bloods Hyundai dealer not found in database');
      process.exit(1);
    }

    console.log(`✓ Found dealer: ${dealer.name} (${dealer.id})`);

    // Create routing rules
    const routingRules = createRoutingRules();

    // Update dealer with routing rules
    await db
      .update(dealers)
      .set({ routingRules })
      .where(eq(dealers.id, dealer.id));

    console.log('\n✅ Routing rules configured successfully!\n');
    console.log('📋 Rules created:');
    routingRules.forEach((rule, index) => {
      console.log(`   ${index + 1}. ${rule.name}`);
      console.log(`      → ${rule.actions.send_to.join(', ')}`);
    });

    console.log('\n📧 Email routing summary:');
    console.log(`   Parts/Fleet/Contact: ${EMAILS.parts}`);
    console.log(`   Service: ${EMAILS.service}`);
    console.log(`   Sell My Car: ${EMAILS.sellCar.join(', ')}`);
    console.log(`   Showroom/Test Drive/Finance: ${EMAILS.showroom}`);
    console.log(`   New Vehicle Sales: ${EMAILS.salesNew}`);
    console.log(`   Demo Vehicle Sales: ${EMAILS.salesDemo}`);
    console.log(`   Used Vehicle Sales: ${EMAILS.salesUsed}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error seeding routing rules:', error);
    process.exit(1);
  }
}

seedRoutingRules();
