/**
 * One-time script to enable the finance widget settings
 * Run with: npx tsx scripts/enable-finance-widget.ts [dealer-slug]
 *
 * Example:
 *   DATABASE_URL=your_connection_string npx tsx scripts/enable-finance-widget.ts bloods-hyundai
 */
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../server/database/schema';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const dealerSlug = process.argv[2] || 'bloods-hyundai';

  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    console.log('   Run with: DATABASE_URL=your_connection_string npx tsx scripts/enable-finance-widget.ts [dealer-slug]');
    console.log('   Example:  DATABASE_URL=... npx tsx scripts/enable-finance-widget.ts bloods-hyundai');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  const baseUrl = 'https://apply.youxpowered.com.au/m5287';

  console.log(`Updating finance widget settings for dealer: ${dealerSlug}`);

  try {
    // Get current dealer settings
    const [dealer] = await db
      .select({ id: schema.dealers.id, settings: schema.dealers.settings })
      .from(schema.dealers)
      .where(eq(schema.dealers.slug, dealerSlug))
      .limit(1);

    if (!dealer) {
      console.error(`Dealer with slug "${dealerSlug}" not found`);
      process.exit(1);
    }

    // Merge finance widget settings into existing settings
    const currentSettings = (dealer.settings as Record<string, any>) || {};
    const updatedSettings = {
      ...currentSettings,
      financeWidget: {
        useFinanceWidget: true,
        financeWidgetIframe: baseUrl,
        financeWidgetProvider: 'youxpowered',
      },
    };

    // Update the dealer settings
    await db
      .update(schema.dealers)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(schema.dealers.id, dealer.id));

    console.log('Finance widget enabled successfully!');
    console.log('');
    console.log('Settings applied:');
    console.log(`   - useFinanceWidget: true`);
    console.log(`   - financeWidgetIframe: ${baseUrl}`);
    console.log(`   - financeWidgetProvider: youxpowered`);
    console.log('');
    console.log('The finance widget will now appear in:');
    console.log('   - Vehicle Enquiry Form (on vehicle detail pages)');
    console.log('   - Finance Page (/finance/[id]/[slug])');

  } catch (error) {
    console.error('Error updating settings:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
