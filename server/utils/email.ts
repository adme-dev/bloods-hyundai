/**
 * Email Notification Utility
 * Handles sending emails for enquiries using SendGrid
 */

import sgMail from '@sendgrid/mail';
import { db } from './db';
import { emailLogs } from '../database/schema';

export interface EmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  from?: {
    email: string;
    name: string;
  };
}

// Initialize SendGrid
let sendGridInitialized = false;

function initSendGrid() {
  if (sendGridInitialized) return true;
  
  const config = useRuntimeConfig();
  const apiKey = config.sendgridApiKey || process.env.SENDGRID_API_KEY;
  
  if (apiKey) {
    sgMail.setApiKey(apiKey);
    sendGridInitialized = true;
    console.log('✅ SendGrid initialized');
    return true;
  }
  
  console.warn('⚠️ SendGrid API key not configured - emails will be logged only');
  return false;
}

/**
 * Form notification settings interface
 */
interface FormNotification {
  id: string;
  name: string;
  type: 'admin' | 'customer';
  isActive: boolean;
  sendTo?: string[];
  cc?: string;
  bcc?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  hasConditions?: boolean;
  conditions?: Array<{ field: string; operator: string; value: string }>;
}

/**
 * Get form-specific notification settings from dealer config
 */
function getFormNotifications(dealer: any, formType: string): FormNotification[] {
  const settings = dealer.settings || {};
  const formSettings = settings.forms?.[formType] || {};
  return formSettings.notifications || [];
}

/**
 * Replace merge tags in text with actual values
 */
function replaceMergeTags(text: string, enquiry: any, dealer: any): string {
  const replacements: Record<string, string> = {
    '{customer_name}': `${enquiry.firstName} ${enquiry.lastName}`,
    '{first_name}': enquiry.firstName || '',
    '{last_name}': enquiry.lastName || '',
    '{email}': enquiry.email || '',
    '{phone}': enquiry.phone || '',
    '{form_type}': enquiry.type || '',
    '{vehicle_make}': enquiry.vehicleInfo?.make || '',
    '{vehicle_model}': enquiry.vehicleInfo?.model || '',
    '{vehicle_year}': enquiry.vehicleInfo?.year?.toString() || '',
    '{vehicle_condition}': enquiry.vehicleInfo?.condition || '',
    '{message}': enquiry.message || '',
    '{submission_date}': new Date(enquiry.createdAt).toLocaleString('en-AU'),
    '{enquiry_id}': enquiry.id?.substring(0, 8) || '',
    '{admin_link}': `${dealer.websiteUrl || 'https://salehyundai.com.au'}/admin/enquiries/${enquiry.id}`,
    '{dealer_name}': dealer.name || '',
    '{dealer_phone}': dealer.phone || '',
    '{dealer_email}': dealer.email || '',
    '{dealer_address}': dealer.address || '',
  };

  let result = text;
  for (const [tag, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return result;
}

/**
 * Check if notification conditions are met
 */
function checkNotificationConditions(notification: FormNotification, enquiry: any): boolean {
  if (!notification.hasConditions || !notification.conditions?.length) {
    return true; // No conditions = always send
  }

  return notification.conditions.every(condition => {
    const fieldValue = getNestedValue(enquiry, condition.field);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return String(fieldValue).toLowerCase() === String(conditionValue).toLowerCase();
      case 'not_equals':
        return String(fieldValue).toLowerCase() !== String(conditionValue).toLowerCase();
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      default:
        return true;
    }
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Send all notifications for an enquiry based on form configuration
 */
export async function sendFormNotifications(
  enquiry: any,
  dealer: any
): Promise<void> {
  const formType = enquiry.type;
  const notifications = getFormNotifications(dealer, formType);

  console.log(`📧 [Email] Processing notifications for form type: ${formType}`);
  console.log(`📧 [Email] Found ${notifications.length} notification(s) configured`);

  // If no custom notifications configured, use defaults
  if (notifications.length === 0) {
    console.log('📧 [Email] No custom notifications - using defaults');
    await sendDefaultNotifications(enquiry, dealer);
    return;
  }

  // Process each notification
  for (const notification of notifications) {
    if (!notification.isActive) {
      console.log(`📧 [Email] Skipping inactive notification: ${notification.name}`);
      continue;
    }

    // Check conditions
    if (!checkNotificationConditions(notification, enquiry)) {
      console.log(`📧 [Email] Conditions not met for: ${notification.name}`);
      continue;
    }

    try {
      if (notification.type === 'admin') {
        await sendAdminNotification(enquiry, dealer, notification);
      } else if (notification.type === 'customer') {
        await sendCustomerNotification(enquiry, dealer, notification);
      }
    } catch (error) {
      console.error(`📧 [Email] Failed to send notification "${notification.name}":`, error);
    }
  }
}

/**
 * Send admin notification using form settings
 */
async function sendAdminNotification(
  enquiry: any,
  dealer: any,
  notification: FormNotification
): Promise<void> {
  const recipients = notification.sendTo?.filter(e => e.trim()) || [dealer.email];
  
  if (recipients.length === 0) {
    console.log('📧 [Email] No admin recipients configured');
    return;
  }

  const subject = replaceMergeTags(notification.subject || getEnquirySubject(enquiry, dealer), enquiry, dealer);
  const bodyText = notification.bodyText 
    ? replaceMergeTags(notification.bodyText, enquiry, dealer)
    : generateEnquiryEmailText(enquiry, dealer);
  const bodyHtml = notification.bodyHtml
    ? replaceMergeTags(notification.bodyHtml, enquiry, dealer)
    : generateEnquiryEmailHTML(enquiry, dealer);

  const fromEmail = notification.fromEmail || notification.replyTo || dealer.email || 'noreply@salehyundai.com.au';
  
  const emailOptions: EmailOptions = {
    to: recipients,
    cc: notification.cc ? [notification.cc] : undefined,
    bcc: notification.bcc ? [notification.bcc] : undefined,
    subject,
    html: bodyHtml,
    text: bodyText,
    from: {
      email: fromEmail,
      name: notification.fromName || dealer.name || 'Sale Hyundai',
    },
  };

  console.log(`📧 [Email] Sending admin notification "${notification.name}" to: ${recipients.join(', ')} from: ${fromEmail}`);
  await sendEmail(emailOptions, enquiry.id, dealer.id, 'admin-notification', 'staff');
}

/**
 * Send customer notification using form settings
 */
async function sendCustomerNotification(
  enquiry: any,
  dealer: any,
  notification: FormNotification
): Promise<void> {
  const subject = replaceMergeTags(notification.subject || `Thank you for your enquiry - ${dealer.name}`, enquiry, dealer);
  const bodyText = notification.bodyText
    ? replaceMergeTags(notification.bodyText, enquiry, dealer)
    : generateCustomerConfirmationText(enquiry, dealer);
  const bodyHtml = notification.bodyHtml
    ? replaceMergeTags(notification.bodyHtml, enquiry, dealer)
    : generateCustomerConfirmationHTML(enquiry, dealer);

  const fromEmail = notification.fromEmail || notification.replyTo || dealer.email || 'noreply@salehyundai.com.au';

  const emailOptions: EmailOptions = {
    to: [enquiry.email],
    subject,
    html: bodyHtml,
    text: bodyText,
    from: {
      email: fromEmail,
      name: notification.fromName || dealer.name || 'Sale Hyundai',
    },
  };

  console.log(`📧 [Email] Sending customer notification "${notification.name}" to: ${enquiry.email} from: ${fromEmail}`);
  await sendEmail(emailOptions, enquiry.id, dealer.id, 'customer-notification', 'customer');
}

/**
 * Send default notifications when no form-specific ones are configured
 */
async function sendDefaultNotifications(enquiry: any, dealer: any): Promise<void> {
  // Send to staff
  await sendEnquiryNotification(enquiry, dealer, [dealer.email || 'enquiries@salehyundai.com.au']);
  
  // Send to customer
  await sendCustomerConfirmation(enquiry, dealer);
}

/**
 * Send enquiry notification email to staff (fallback/legacy)
 */
export async function sendEnquiryNotification(
  enquiry: any,
  dealer: any,
  recipients: string[],
  options?: {
    cc?: string[];
    bcc?: string[];
    priority?: string;
  }
): Promise<void> {
  const subject = getEnquirySubject(enquiry, dealer);
  const html = generateEnquiryEmailHTML(enquiry, dealer);
  const text = generateEnquiryEmailText(enquiry, dealer);
  
  const emailOptions: EmailOptions = {
    to: recipients,
    cc: options?.cc,
    bcc: options?.bcc,
    subject,
    html,
    text,
    from: {
      email: dealer.email || 'noreply@salehyundai.com.au',
      name: dealer.name || 'Sale Hyundai',
    },
  };
  
  await sendEmail(emailOptions, enquiry.id, dealer.id, 'staff-notification', 'staff');
}

/**
 * Send confirmation email to customer (fallback/legacy)
 */
export async function sendCustomerConfirmation(
  enquiry: any,
  dealer: any
): Promise<void> {
  const subject = `Thank you for your enquiry - ${dealer.name}`;
  const html = generateCustomerConfirmationHTML(enquiry, dealer);
  const text = generateCustomerConfirmationText(enquiry, dealer);

  const emailOptions: EmailOptions = {
    to: [enquiry.email],
    subject,
    html,
    text,
    from: {
      email: dealer.email || 'noreply@salehyundai.com.au',
      name: dealer.name || 'Sale Hyundai',
    },
  };

  await sendEmail(emailOptions, enquiry.id, dealer.id, 'customer-confirmation', 'customer');
}

/**
 * Core email sending function using SendGrid
 */
async function sendEmail(
  options: EmailOptions,
  enquiryId: string,
  dealerId: string,
  templateId: string = 'enquiry-notification',
  recipientType: string = 'staff'
): Promise<void> {
  const startTime = Date.now();
  const isSendGridAvailable = initSendGrid();
  
  try {
    const fromEmail = options.from?.email || 'noreply@salehyundai.com.au';
    const fromName = options.from?.name || 'Sale Hyundai';
    
    console.log('📧 Sending email:');
    console.log('To:', options.to.join(', '));
    if (options.cc?.length) console.log('CC:', options.cc.join(', '));
    if (options.bcc?.length) console.log('BCC:', options.bcc.join(', '));
    console.log('Subject:', options.subject);
    console.log('From:', `${fromName} <${fromEmail}>`);
    
    if (isSendGridAvailable) {
      // Build SendGrid message
      const msg: sgMail.MailDataRequired = {
        to: options.to,
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: options.subject,
        html: options.html,
        text: options.text || stripHtml(options.html),
      };
      
      // Add CC if provided
      if (options.cc?.length) {
        msg.cc = options.cc;
      }
      
      // Add BCC if provided  
      if (options.bcc?.length) {
        msg.bcc = options.bcc;
      }
      
      // Send via SendGrid
      const [response] = await sgMail.send(msg);
      
      console.log(`✅ Email sent via SendGrid (${response.statusCode}) in ${Date.now() - startTime}ms`);
      
      // Log success to database
      await db.insert(emailLogs).values({
        enquiryId,
        dealerId,
        templateId,
        recipientEmail: options.to[0],
        recipientType,
        subject: options.subject,
        status: 'sent',
        sendgridMessageId: response.headers?.['x-message-id'] || null,
        templateData: {
          to: options.to,
          cc: options.cc,
          bcc: options.bcc,
          from: options.from,
          sendgrid_status_code: response.statusCode,
        },
      });
    } else {
      // No SendGrid - just log to console and database
      console.log('⚠️ SendGrid not configured - email logged but not sent');
      console.log('---');
      
      await db.insert(emailLogs).values({
        enquiryId,
        dealerId,
        templateId,
        recipientEmail: options.to[0],
        recipientType,
        subject: options.subject,
        status: 'queued',
        templateData: {
          to: options.to,
          cc: options.cc,
          bcc: options.bcc,
          from: options.from,
          note: 'SendGrid not configured - email was not sent',
        },
      });
    }
    
  } catch (error: any) {
    console.error('❌ Email send failed:', error);
    
    // Extract SendGrid error details if available
    const errorMessage = error?.response?.body?.errors?.[0]?.message 
      || error?.message 
      || 'Unknown error';
    
    // Log failure to database
    try {
      await db.insert(emailLogs).values({
        enquiryId,
        dealerId,
        templateId,
        recipientEmail: options.to[0],
        recipientType,
        subject: options.subject,
        status: 'failed',
        errorMessage,
        templateData: { 
          error: String(error),
          sendgrid_response: error?.response?.body,
        },
      });
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }
    
    throw error;
  }
}

/**
 * Strip HTML tags to create plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate email subject for enquiry
 */
function getEnquirySubject(enquiry: any, dealer: any): string {
  const typeLabels: Record<string, string> = {
    vehicle: 'Vehicle Enquiry',
    contact: 'Contact Enquiry',
    finance: 'Finance Enquiry',
    service: 'Service Booking',
    parts: 'Parts Enquiry',
    test_drive: 'Test Drive Request',
    sell_car: 'Sell My Car',
    accessories: 'Accessories Enquiry',
  };
  
  const typeLabel = typeLabels[enquiry.type] || 'New Enquiry';
  const customerName = `${enquiry.firstName} ${enquiry.lastName}`;
  
  return `${typeLabel} - ${customerName} - ${dealer.name}`;
}

/**
 * Format currency for display
 */
function formatCurrency(value: number | undefined): string {
  if (!value) return '$0.00';
  return '$' + value.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Generate email header with logo and branding
 * Best practice: Logo centered with white space, clear branding
 *
 * Supports customizable header background via dealer.emailHeaderBgColor
 * Default: white (#FFFFFF) if logo exists (most logos are dark), otherwise primary color
 */
function generateEmailHeader(dealer: any, title: string): string {
  const primaryColor = dealer.primaryColor || '#001E50';

  // Header background: Always use white for dark mode compatibility
  // This prevents logo bleeding into dark backgrounds in email clients with dark mode
  const headerBgColor = dealer.emailHeaderBgColor || '#FFFFFF';

  // Determine text color based on background brightness
  const isLightBackground = isLightColor(headerBgColor);
  const textColor = isLightBackground ? '#1a1a1a' : '#ffffff';

  const logoSection = dealer.logoUrl
    ? `<img src="${dealer.logoUrl}" alt="${dealer.name}" style="max-width: 200px; max-height: 60px; height: auto; display: block; margin: 0 auto;" />`
    : `<h1 style="margin: 0; font-size: 24px; color: ${textColor};">${dealer.name}</h1>`;

  // Use table-based layout with explicit bgcolor attribute for dark mode compatibility
  // The bgcolor attribute forces email clients to respect the background color in dark mode
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: ${headerBgColor};" bgcolor="${headerBgColor}">
    <tr>
      <td align="center" style="padding: 30px 20px; border-bottom: 3px solid ${primaryColor}; background-color: ${headerBgColor};" bgcolor="${headerBgColor}">
        <table role="presentation" cellpadding="0" cellspacing="0" style="background-color: ${headerBgColor};" bgcolor="${headerBgColor}">
          <tr>
            <td align="center" style="padding-bottom: 15px; background-color: ${headerBgColor};" bgcolor="${headerBgColor}">
              ${logoSection}
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: ${headerBgColor};" bgcolor="${headerBgColor}">
              <p style="margin: 0; color: ${textColor}; font-size: 16px; font-weight: 500;">${title}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;
}

/**
 * Determine if a hex color is "light" (better with dark text)
 */
function isLightColor(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance (perceived brightness)
  // Using the formula: (0.299*R + 0.587*G + 0.114*B)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5;
}

/**
 * Generate social media icons for email footer
 * Best practice: Give people a reason to connect, use recognizable icons
 */
function generateSocialMediaHTML(dealer: any): string {
  const socialLinks = [];

  // Using inline SVG data URIs for better email compatibility
  if (dealer.facebookUrl) {
    socialLinks.push(`
      <a href="${dealer.facebookUrl}" target="_blank" rel="noopener" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/32/733/733547.png" alt="Facebook" width="28" height="28" style="border: 0;" />
      </a>
    `);
  }

  if (dealer.instagramUrl) {
    socialLinks.push(`
      <a href="${dealer.instagramUrl}" target="_blank" rel="noopener" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/32/2111/2111463.png" alt="Instagram" width="28" height="28" style="border: 0;" />
      </a>
    `);
  }

  if (dealer.linkedinUrl) {
    socialLinks.push(`
      <a href="${dealer.linkedinUrl}" target="_blank" rel="noopener" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/32/3536/3536505.png" alt="LinkedIn" width="28" height="28" style="border: 0;" />
      </a>
    `);
  }

  if (dealer.youtubeUrl) {
    socialLinks.push(`
      <a href="${dealer.youtubeUrl}" target="_blank" rel="noopener" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/32/1384/1384060.png" alt="YouTube" width="28" height="28" style="border: 0;" />
      </a>
    `);
  }

  if (dealer.twitterUrl) {
    socialLinks.push(`
      <a href="${dealer.twitterUrl}" target="_blank" rel="noopener" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/32/733/733579.png" alt="Twitter" width="28" height="28" style="border: 0;" />
      </a>
    `);
  }

  if (socialLinks.length === 0) return '';

  return `
  <div style="margin: 20px 0; text-align: center;">
    <p style="margin: 0 0 12px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Connect With Us</p>
    <div>
      ${socialLinks.join('')}
    </div>
  </div>
  `;
}

/**
 * Generate professional email footer with dealership details
 * Best practice: Clear contact info, physical address (CAN-SPAM), unsubscribe option, social links
 */
function generateEmailFooter(dealer: any, options?: { showUnsubscribe?: boolean; isCustomerEmail?: boolean }): string {
  const primaryColor = dealer.primaryColor || '#001E50';
  const showUnsubscribe = options?.showUnsubscribe ?? options?.isCustomerEmail ?? false;

  // Build address string
  const addressParts = [dealer.address, dealer.suburb, dealer.state, dealer.postcode].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  // Social media section
  const socialSection = generateSocialMediaHTML(dealer);

  return `
  <div style="background: #f8f9fa; border-top: 3px solid ${primaryColor}; padding: 30px 20px; margin-top: 30px;">
    <!-- Dealership Info -->
    <div style="text-align: center; margin-bottom: 20px;">
      ${dealer.logoUrl ? `
      <div style="margin-bottom: 15px;">
        <img src="${dealer.logoUrl}" alt="${dealer.name}" style="max-width: 150px; max-height: 45px; height: auto; opacity: 0.9;" />
      </div>
      ` : `
      <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: ${primaryColor};">${dealer.name}</p>
      `}
    </div>

    <!-- Contact Details -->
    <table style="width: 100%; max-width: 400px; margin: 0 auto 20px auto; border-collapse: collapse;">
      ${dealer.phone ? `
      <tr>
        <td style="padding: 6px 10px; text-align: center;">
          <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Phone</span><br>
          <a href="tel:${dealer.phone}" style="color: ${primaryColor}; text-decoration: none; font-size: 15px; font-weight: 500;">${dealer.phone}</a>
        </td>
      </tr>
      ` : ''}
      ${dealer.email ? `
      <tr>
        <td style="padding: 6px 10px; text-align: center;">
          <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Email</span><br>
          <a href="mailto:${dealer.email}" style="color: ${primaryColor}; text-decoration: none; font-size: 14px;">${dealer.email}</a>
        </td>
      </tr>
      ` : ''}
      ${fullAddress ? `
      <tr>
        <td style="padding: 6px 10px; text-align: center;">
          <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Visit Us</span><br>
          <span style="color: #333; font-size: 14px;">${fullAddress}</span>
        </td>
      </tr>
      ` : ''}
      ${dealer.websiteUrl ? `
      <tr>
        <td style="padding: 6px 10px; text-align: center;">
          <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Website</span><br>
          <a href="${dealer.websiteUrl}" style="color: ${primaryColor}; text-decoration: none; font-size: 14px;">${dealer.websiteUrl.replace(/^https?:\/\//, '')}</a>
        </td>
      </tr>
      ` : ''}
    </table>

    ${socialSection}

    <!-- Legal Footer -->
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; margin-top: 20px;">
      <p style="margin: 0; font-size: 11px; color: #999; line-height: 1.8;">
        &copy; ${new Date().getFullYear()} ${dealer.name}. All rights reserved.
        ${dealer.oem ? `<br>Authorised ${dealer.oem} Dealer` : ''}
      </p>
      ${showUnsubscribe ? `
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #aaa;">
        <a href="${dealer.websiteUrl || '#'}/unsubscribe" style="color: #888; text-decoration: underline;">Unsubscribe</a> from marketing emails
      </p>
      ` : ''}
    </div>
  </div>
  `;
}

/**
 * Generate vehicle info HTML section for emails
 * Note: Vehicle images from external sources may return 404, so we use onerror fallback
 */
function generateVehicleInfoHTML(enquiry: any): string {
  const vehicleInfo = enquiry.vehicleInfo;
  if (!vehicleInfo) return '';

  console.log('[Email] Vehicle Info:', JSON.stringify(vehicleInfo, null, 2));
  console.log('[Email] Thumbnail URL:', vehicleInfo.thumbnail);

  const vehicleName = [
    vehicleInfo.year,
    vehicleInfo.make,
    vehicleInfo.model,
    vehicleInfo.variant,
  ].filter(Boolean).join(' ').trim();

  if (!vehicleName && !vehicleInfo.price) return '';

  // Generate a placeholder image URL using UI Avatars as fallback (works in all email clients)
  const placeholderText = encodeURIComponent(vehicleInfo.make?.substring(0, 1) || 'V');
  const placeholderUrl = `https://ui-avatars.com/api/?name=${placeholderText}&background=001E50&color=fff&size=400&bold=true`;

  // Only include image if thumbnail exists, with graceful fallback handling
  // Note: onerror doesn't work in all email clients, so we also style the container
  const imageSection = vehicleInfo.thumbnail ? `
    <div style="margin-bottom: 15px; background: #e5e7eb; border-radius: 8px; min-height: 120px; display: flex; align-items: center; justify-content: center;">
      <img src="${vehicleInfo.thumbnail}"
           alt="${vehicleName}"
           style="max-width: 100%; height: auto; border-radius: 8px; max-height: 200px; object-fit: cover; display: block;"
           onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'padding:40px;text-align:center;color:#666;\\'>Vehicle Image</div>';" />
    </div>
    ` : '';

  return `
  <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
    <h2 style="margin-top: 0; color: #001E50;">Vehicle Details</h2>
    ${imageSection}
    <table style="width: 100%; border-collapse: collapse;">
      ${vehicleName ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Vehicle:</td>
        <td style="padding: 8px 0;"><strong>${vehicleName}</strong></td>
      </tr>
      ` : ''}
      ${vehicleInfo.price ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Price:</td>
        <td style="padding: 8px 0;">${formatCurrency(vehicleInfo.price)}</td>
      </tr>
      ` : ''}
      ${vehicleInfo.condition ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Condition:</td>
        <td style="padding: 8px 0;">${vehicleInfo.condition}</td>
      </tr>
      ` : ''}
      ${vehicleInfo.stockId ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Stock #:</td>
        <td style="padding: 8px 0;">${vehicleInfo.stockId}</td>
      </tr>
      ` : ''}
      ${vehicleInfo.kms ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Odometer:</td>
        <td style="padding: 8px 0;">${vehicleInfo.kms}</td>
      </tr>
      ` : ''}
      ${vehicleInfo.colour ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Colour:</td>
        <td style="padding: 8px 0;">${vehicleInfo.colour}</td>
      </tr>
      ` : ''}
      ${vehicleInfo.transmission ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Transmission:</td>
        <td style="padding: 8px 0;">${vehicleInfo.transmission}</td>
      </tr>
      ` : ''}
      ${vehicleInfo.fuel ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Fuel:</td>
        <td style="padding: 8px 0;">${vehicleInfo.fuel}</td>
      </tr>
      ` : ''}
      ${vehicleInfo.engine ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Engine:</td>
        <td style="padding: 8px 0;">${vehicleInfo.engine}</td>
      </tr>
      ` : ''}
      ${vehicleInfo.body ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Body Type:</td>
        <td style="padding: 8px 0;">${vehicleInfo.body}</td>
      </tr>
      ` : ''}
      ${vehicleInfo.drivetrain ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Drivetrain:</td>
        <td style="padding: 8px 0;">${vehicleInfo.drivetrain}</td>
      </tr>
      ` : ''}
    </table>
    ${generateConfigurationSection(vehicleInfo.configuration)}
    ${generateOffersSection(vehicleInfo.appliedOffers)}
  </div>
  `;
}

/**
 * Generate configuration breakdown section for vehicle builder enquiries
 */
function generateConfigurationSection(configuration: any): string {
  if (!configuration) return '';

  const hasOptions = configuration.optionPack || configuration.prepaidService ||
                     configuration.colourPrice > 0 || configuration.trimPrice > 0;

  if (!hasOptions) return '';

  return `
    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
      <h3 style="margin: 0 0 10px 0; color: #001E50; font-size: 14px;">Selected Options</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        ${configuration.optionPack ? `
        <tr>
          <td style="padding: 6px 0; color: #555;">Option Pack:</td>
          <td style="padding: 6px 0; text-align: right;">${configuration.optionPack}${configuration.optionPackPrice > 0 ? ` (+${formatCurrency(configuration.optionPackPrice)})` : ''}</td>
        </tr>
        ` : ''}
        ${configuration.trim ? `
        <tr>
          <td style="padding: 6px 0; color: #555;">Interior Trim:</td>
          <td style="padding: 6px 0; text-align: right;">${configuration.trim}${configuration.trimPrice > 0 ? ` (+${formatCurrency(configuration.trimPrice)})` : ''}</td>
        </tr>
        ` : ''}
        ${configuration.prepaidService ? `
        <tr>
          <td style="padding: 6px 0; color: #555;">Prepaid Service:</td>
          <td style="padding: 6px 0; text-align: right;">${configuration.prepaidService}${configuration.prepaidServicePrice > 0 ? ` (+${formatCurrency(configuration.prepaidServicePrice)})` : ''}</td>
        </tr>
        ` : ''}
        ${configuration.totalPrice && configuration.basePrice && configuration.totalPrice !== configuration.basePrice ? `
        <tr style="border-top: 1px solid #e0e0e0;">
          <td style="padding: 8px 0; font-weight: bold;">Total Configured Price:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCurrency(configuration.totalPrice)}</td>
        </tr>
        ` : ''}
      </table>
    </div>
  `;
}

/**
 * Generate applied offers section for vehicle builder enquiries
 */
function generateOffersSection(appliedOffers: any[]): string {
  if (!appliedOffers || appliedOffers.length === 0) return '';

  const offersHtml = appliedOffers.map(offer => `
    <div style="background: #e8f4f8; padding: 10px 12px; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid #00aad2;">
      <strong style="color: #001E50;">${offer.title || 'Special Offer'}</strong>
      ${offer.formattedValue ? `<span style="color: #00aad2; margin-left: 8px;">${offer.formattedValue}</span>` : ''}
      ${offer.type ? `<span style="color: #666; font-size: 12px; display: block; margin-top: 4px;">Type: ${offer.type}</span>` : ''}
    </div>
  `).join('');

  return `
    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
      <h3 style="margin: 0 0 10px 0; color: #001E50; font-size: 14px;">Active Offers</h3>
      ${offersHtml}
    </div>
  `;
}

/**
 * Generate accessories cart section for vehicle builder enquiries
 */
function generateAccessoriesSection(accessoriesCart: any): string {
  if (!accessoriesCart || !accessoriesCart.items || accessoriesCart.items.length === 0) return '';

  const itemsHtml = accessoriesCart.items.map((item: any) => {
    const imageHtml = item.thumbnail ? `
      <img src="${item.thumbnail}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 12px;" />
    ` : '';

    return `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; vertical-align: middle;">
          <div style="display: flex; align-items: center;">
            ${imageHtml}
            <div>
              <strong style="color: #333;">${item.name}</strong>
              ${item.partNumber ? `<span style="color: #666; font-size: 12px; display: block;">Part #: ${item.partNumber}</span>` : ''}
              ${item.type === 'pack' ? `<span style="background: #e8f4f8; color: #00aad2; font-size: 11px; padding: 2px 6px; border-radius: 3px; margin-top: 4px; display: inline-block;">Pack</span>` : ''}
            </div>
          </div>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center; color: #666;">
          x${item.quantity || 1}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 500;">
          ${formatCurrency(item.subtotal || item.price)}
        </td>
      </tr>
    `;
  }).join('');

  return `
  <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
    <h2 style="margin-top: 0; color: #001E50;">Selected Accessories</h2>
    ${accessoriesCart.model ? `<p style="color: #666; margin: 0 0 15px 0;">For: ${accessoriesCart.model}</p>` : ''}
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #ddd;">
          <th style="text-align: left; padding: 8px 0; color: #555; font-weight: 600;">Item</th>
          <th style="text-align: center; padding: 8px 0; color: #555; font-weight: 600; width: 60px;">Qty</th>
          <th style="text-align: right; padding: 8px 0; color: #555; font-weight: 600; width: 100px;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px 0; font-weight: bold; color: #001E50;">Total (${accessoriesCart.itemCount} items)</td>
          <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #001E50; font-size: 16px;">${formatCurrency(accessoriesCart.total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>
  `;
}

/**
 * Generate finance info HTML section for emails
 */
function generateFinanceInfoHTML(enquiry: any): string {
  const financeInfo = enquiry.financeDetails;
  if (!financeInfo) return '';

  return `
  <div style="background: linear-gradient(135deg, #001E50 0%, #1a4a8a 100%); color: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
    <h2 style="margin-top: 0; color: white;">Finance Calculator Details</h2>
    <div style="background: white; color: #333; padding: 15px; border-radius: 8px; margin-top: 15px;">
      <table style="width: 100%; border-collapse: collapse;">
        ${financeInfo.selectedPayment ? `
        <tr style="background: #f0f4f8;">
          <td style="padding: 12px; font-weight: bold; font-size: 16px;">Selected Payment:</td>
          <td style="padding: 12px; font-size: 20px; font-weight: bold; color: #001E50;">${financeInfo.selectedPayment} ${financeInfo.paymentFrequency || ''}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">Vehicle Price:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${formatCurrency(financeInfo.vehiclePrice)}</td>
        </tr>
        ${financeInfo.deposit ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">Deposit:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${formatCurrency(financeInfo.deposit)}</td>
        </tr>
        ` : ''}
        ${financeInfo.tradeInValue ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">Trade-in Value:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${formatCurrency(financeInfo.tradeInValue)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">Loan Amount:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>${formatCurrency(financeInfo.loanAmount)}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">Loan Term:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${financeInfo.loanTermYears || Math.round((financeInfo.loanTermMonths || 0) / 12)} years (${financeInfo.loanTermMonths || 0} months)</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">Interest Rate:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${financeInfo.interestRate?.toFixed(2) || '0.00'}%</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">Comparison Rate:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${financeInfo.comparisonRate?.toFixed(2) || '0.00'}%</td>
        </tr>
      </table>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #001E50;">
        <h4 style="margin: 0 0 10px 0; color: #001E50;">Payment Options:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; text-align: center; background: ${financeInfo.paymentFrequency === 'weekly' ? '#001E50' : '#f5f5f5'}; color: ${financeInfo.paymentFrequency === 'weekly' ? 'white' : '#333'}; border-radius: 4px;">
              <div style="font-size: 12px;">Weekly</div>
              <div style="font-size: 16px; font-weight: bold;">${formatCurrency(financeInfo.weeklyPayment)}</div>
            </td>
            <td style="padding: 8px; text-align: center; background: ${financeInfo.paymentFrequency === 'fortnightly' ? '#001E50' : '#f5f5f5'}; color: ${financeInfo.paymentFrequency === 'fortnightly' ? 'white' : '#333'}; border-radius: 4px;">
              <div style="font-size: 12px;">Fortnightly</div>
              <div style="font-size: 16px; font-weight: bold;">${formatCurrency(financeInfo.fortnightlyPayment)}</div>
            </td>
            <td style="padding: 8px; text-align: center; background: ${financeInfo.paymentFrequency === 'monthly' ? '#001E50' : '#f5f5f5'}; color: ${financeInfo.paymentFrequency === 'monthly' ? 'white' : '#333'}; border-radius: 4px;">
              <div style="font-size: 12px;">Monthly</div>
              <div style="font-size: 16px; font-weight: bold;">${formatCurrency(financeInfo.monthlyPayment)}</div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
  `;
}

/**
 * Generate HTML email for staff notification
 * Best practices applied: Logo header, mobile-responsive, clear CTA, professional footer
 */
function generateEnquiryEmailHTML(enquiry: any, dealer: any): string {
  const primaryColor = dealer.primaryColor || '#001E50';

  // Generate vehicle, finance, and accessories sections
  const vehicleSection = generateVehicleInfoHTML(enquiry);
  const financeSection = enquiry.financeInterest ? generateFinanceInfoHTML(enquiry) : '';
  const accessoriesSection = generateAccessoriesSection(enquiry.accessoriesCart);

  // Use the new header and footer components
  const header = generateEmailHeader(dealer, 'New Enquiry Received');
  const footer = generateEmailFooter(dealer, { isCustomerEmail: false });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Enquiry - ${dealer.name}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
  <!-- Email wrapper for background color -->
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td style="padding: 20px 10px;">
        <!-- Main content container -->
        <table role="presentation" style="max-width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td>
              ${header}
            </td>
          </tr>
          <tr>
            <td style="padding: 25px 20px;">
              <!-- Customer Details Section -->
              <div style="background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid ${primaryColor};">
                <h2 style="margin: 0 0 15px 0; color: ${primaryColor}; font-size: 18px;">Customer Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #555; width: 120px;">Name:</td>
                    <td style="padding: 8px 0;">${enquiry.firstName} ${enquiry.lastName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #555;">Email:</td>
                    <td style="padding: 8px 0;"><a href="mailto:${enquiry.email}" style="color: ${primaryColor}; text-decoration: none;">${enquiry.email}</a></td>
                  </tr>
                  ${enquiry.phone ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #555;">Phone:</td>
                    <td style="padding: 8px 0;"><a href="tel:${enquiry.phone}" style="color: ${primaryColor}; text-decoration: none;">${enquiry.phone}</a></td>
                  </tr>
                  ` : ''}
                  ${enquiry.suburb || enquiry.state ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #555;">Location:</td>
                    <td style="padding: 8px 0;">${enquiry.suburb || ''}${enquiry.state ? ', ' + enquiry.state : ''} ${enquiry.postcode || ''}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              ${vehicleSection}

              ${accessoriesSection}

              ${financeSection}

              ${enquiry.message ? `
              <!-- Message Section -->
              <div style="background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
                <h2 style="margin: 0 0 15px 0; color: ${primaryColor}; font-size: 18px;">Message</h2>
                <p style="margin: 0; white-space: pre-wrap; color: #333;">${enquiry.message}</p>
              </div>
              ` : ''}

              <!-- Additional Information Section -->
              <div style="background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
                <h2 style="margin: 0 0 15px 0; color: ${primaryColor}; font-size: 18px;">Enquiry Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #555; width: 120px;">Type:</td>
                    <td style="padding: 8px 0; text-transform: capitalize;">${enquiry.type.replace(/_/g, ' ')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #555;">Received:</td>
                    <td style="padding: 8px 0;">${new Date(enquiry.createdAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  </tr>
                  ${enquiry.testDrive ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #555;">Test Drive:</td>
                    <td style="padding: 8px 0;"><span style="color: #22c55e;">✓ Requested</span></td>
                  </tr>
                  ` : ''}
                  ${enquiry.tradeIn ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #555;">Trade-In:</td>
                    <td style="padding: 8px 0;"><span style="color: #22c55e;">✓ Has vehicle</span></td>
                  </tr>
                  ` : ''}
                  ${enquiry.financeInterest ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #555;">Finance:</td>
                    <td style="padding: 8px 0;"><span style="color: #22c55e;">✓ Interested</span></td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- CTA Button - Large and tappable (44x44px minimum) -->
              <div style="text-align: center; padding: 20px 0;">
                <a href="${dealer.websiteUrl || 'https://salehyundai.com.au'}/admin/enquiries/${enquiry.id}"
                   style="display: inline-block; background: ${primaryColor}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; min-height: 44px; line-height: 1.2;">
                  View in Dashboard
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for staff notification
 */
function generateEnquiryEmailText(enquiry: any, dealer: any): string {
  return `
${dealer.name} - New Enquiry Received

CUSTOMER DETAILS
Name: ${enquiry.firstName} ${enquiry.lastName}
Email: ${enquiry.email}
${enquiry.phone ? `Phone: ${enquiry.phone}` : ''}
${enquiry.suburb ? `Location: ${enquiry.suburb}${enquiry.state ? ', ' + enquiry.state : ''} ${enquiry.postcode || ''}` : ''}

${enquiry.vehicleOfInterest ? `VEHICLE OF INTEREST\n${enquiry.vehicleOfInterest}\n` : ''}

${enquiry.message ? `MESSAGE\n${enquiry.message}\n` : ''}

ADDITIONAL INFORMATION
Enquiry Type: ${enquiry.type}
Received: ${new Date(enquiry.createdAt).toLocaleString('en-AU')}
${enquiry.testDrive ? 'Test Drive: ✓ Requested\n' : ''}
${enquiry.tradeIn ? 'Trade-In: ✓ Has vehicle to trade\n' : ''}
${enquiry.financeInterest ? 'Finance: ✓ Interested in finance\n' : ''}

View in Dashboard: ${dealer.websiteUrl || 'https://salehyundai.com.au'}/admin/enquiries/${enquiry.id}

---
This is an automated notification from ${dealer.name} Enquiry Management System
  `.trim();
}

/**
 * Generate HTML confirmation email for customer
 * Best practices applied: Logo header, personalized content, mobile-responsive, professional footer with social links
 */
function generateCustomerConfirmationHTML(enquiry: any, dealer: any): string {
  const primaryColor = dealer.primaryColor || '#001E50';

  // Use the new header and footer components
  const header = generateEmailHeader(dealer, 'Thank You For Your Enquiry');
  const footer = generateEmailFooter(dealer, { isCustomerEmail: true, showUnsubscribe: true });

  // Format enquiry type for display
  const enquiryTypeFormatted = enquiry.type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You - ${dealer.name}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
  <!-- Email wrapper for background color -->
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td style="padding: 20px 10px;">
        <!-- Main content container -->
        <table role="presentation" style="max-width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td>
              ${header}
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 25px;">
              <!-- Personalized greeting -->
              <p style="font-size: 18px; margin: 0 0 20px 0;">Hi ${enquiry.firstName},</p>

              <p style="margin: 0 0 20px 0; font-size: 15px; color: #444;">
                Thank you for contacting <strong>${dealer.name}</strong>. We've received your enquiry and one of our friendly team members will be in touch shortly.
              </p>

              <!-- Enquiry Reference Card -->
              <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); color: white; padding: 25px; margin: 25px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; opacity: 0.9;">Your Enquiry Reference</h3>
                <p style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">#${enquiry.id.substring(0, 8).toUpperCase()}</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; opacity: 0.85;">Type:</td>
                    <td style="padding: 5px 0; font-size: 13px; text-align: right;">${enquiryTypeFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; opacity: 0.85;">Submitted:</td>
                    <td style="padding: 5px 0; font-size: 13px; text-align: right;">${new Date(enquiry.createdAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  </tr>
                </table>
              </div>

              <!-- What happens next -->
              <div style="background: #f8f9fa; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid ${primaryColor};">
                <h3 style="margin: 0 0 12px 0; color: ${primaryColor}; font-size: 16px;">What happens next?</h3>
                <ol style="margin: 0; padding-left: 20px; color: #555; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Our team will review your enquiry</li>
                  <li style="margin-bottom: 8px;">We'll contact you within 24 hours</li>
                  <li style="margin-bottom: 0;">We'll answer any questions and discuss next steps</li>
                </ol>
              </div>

              <!-- Contact CTA -->
              <p style="margin: 25px 0 15px 0; font-size: 15px; color: #444;">
                Can't wait? Contact us directly:
              </p>

              <!-- Contact buttons - Large and tappable -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${dealer.phone ? `
                <tr>
                  <td style="padding: 5px 0;">
                    <a href="tel:${dealer.phone}" style="display: block; background: ${primaryColor}; color: white; padding: 14px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; text-align: center; font-size: 15px;">
                      📞 Call Us: ${dealer.phone}
                    </a>
                  </td>
                </tr>
                ` : ''}
              </table>

              <!-- Closing -->
              <p style="margin: 30px 0 0 0; font-size: 15px; color: #444;">
                We look forward to assisting you!
              </p>

              <p style="margin: 20px 0 0 0; font-size: 15px; color: #444;">
                Best regards,<br>
                <strong>The ${dealer.name} Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td>
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text confirmation email for customer
 */
function generateCustomerConfirmationText(enquiry: any, dealer: any): string {
  return `
${dealer.name}
Thank You For Your Enquiry

Hi ${enquiry.firstName},

Thank you for contacting ${dealer.name}. We've received your enquiry and one of our team members will be in touch shortly.

YOUR ENQUIRY DETAILS
Reference: ${enquiry.id.substring(0, 8)}
Type: ${enquiry.type}
Submitted: ${new Date(enquiry.createdAt).toLocaleString('en-AU')}

In the meantime, feel free to contact us directly:
${dealer.phone ? `Phone: ${dealer.phone}` : ''}
${dealer.email ? `Email: ${dealer.email}` : ''}
${dealer.address ? `Address: ${dealer.address}${dealer.suburb ? ', ' + dealer.suburb : ''}${dealer.state ? ', ' + dealer.state : ''} ${dealer.postcode || ''}` : ''}

We look forward to assisting you!

Best regards,
The ${dealer.name} Team

---
${dealer.name}
${dealer.address || ''} ${dealer.suburb || ''} ${dealer.state || ''} ${dealer.postcode || ''}
${dealer.phone || ''} | ${dealer.email || ''}
${dealer.websiteUrl || ''}
  `.trim();
}






