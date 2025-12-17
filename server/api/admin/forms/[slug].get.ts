import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const slug = getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Form slug is required' });
  }


  // Get dealer settings
  const [dealer] = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, user.dealerId));

  if (!dealer) {
    throw createError({ statusCode: 404, message: 'Dealer not found' });
  }

  // Get form settings from dealer's settings JSON
  const formSettings = (dealer.settings as any)?.forms?.[slug] || {};

  console.log('[Forms GET] Slug:', slug);
  console.log('[Forms GET] Form settings from DB:', JSON.stringify(formSettings, null, 2));
  console.log('[Forms GET] isActive from DB:', formSettings.isActive);

  // Default notification templates
  const defaultNotifications = [
    {
      id: `${slug}-admin-1`,
      name: 'Admin Notification',
      type: 'admin',
      isActive: true,
      sendTo: [dealer.email || 'admin@example.com'],
      fromName: 'Sale Hyundai',
      replyTo: dealer.email || 'enquiries@hyundai.com.au',
      subject: `New ${formatFormName(slug)} Enquiry - Web Site Lead`,
      bodyText: getDefaultAdminBody(slug),
      hasConditions: false,
      conditions: [],
    },
    {
      id: `${slug}-customer-1`,
      name: 'Customer Notification',
      type: 'customer',
      isActive: true,
      fromName: 'Sale Hyundai',
      replyTo: dealer.email || 'enquiries@hyundai.com.au',
      subject: `Thank you for your enquiry - Sale Hyundai`,
      bodyText: getDefaultCustomerBody(slug),
      hasConditions: false,
      conditions: [],
    },
  ];

  // Default confirmation
  const defaultConfirmation = {
    type: 'message',
    title: 'Thank you for your enquiry!',
    message: "We've received your submission and will be in touch within 24 hours.",
    buttonText: 'Back to Home',
    buttonLink: '/',
    redirectUrl: '/thank-you',
  };

  return {
    settings: {
      isActive: formSettings.isActive ?? true,
      title: formSettings.title || formatFormName(slug),
      description: formSettings.description || '',
      saveToDatabase: formSettings.saveToDatabase ?? true,
      requireAllFields: formSettings.requireAllFields ?? false,
      antiSpam: formSettings.antiSpam ?? true,
      defaultAssignee: formSettings.defaultAssignee || null,
    },
    notifications: formSettings.notifications || defaultNotifications,
    confirmation: formSettings.confirmation || defaultConfirmation,
  };
});

function formatFormName(slug: string): string {
  const names: Record<string, string> = {
    vehicle: 'Car Sales',
    contact: 'Contact Us',
    finance: 'Finance Enquiry',
    service: 'Service Enquiry',
    sell_car: 'Sell My Car',
    parts: 'Parts Enquiry',
    accessories: 'Accessories',
    test_drive: 'Test Drive',
    special_offer: 'Special Offers',
  };
  return names[slug] || slug;
}

function getDefaultAdminBody(slug: string): string {
  return `New ${formatFormName(slug)} enquiry received:

Name: {customer_name}
Email: {email}
Phone: {phone}

Form: {form_type}
Date: {submission_date}

Message:
{message}

---
View in admin dashboard`;
}

function getDefaultCustomerBody(slug: string): string {
  return `Dear {first_name},

Thank you for your ${formatFormName(slug).toLowerCase()} enquiry with Sale Hyundai.

We have received your submission and a member of our team will be in touch within 24 hours.

Reference: {enquiry_id}

If you have any urgent questions, please call us.

Kind regards,
Sale Hyundai Team`;
}







