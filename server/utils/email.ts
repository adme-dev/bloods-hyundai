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
 * Generate HTML email for staff notification
 */
function generateEnquiryEmailHTML(enquiry: any, dealer: any): string {
  const vehicleInfo = enquiry.vehicleOfInterest || enquiry.metadata?.vehicle_make 
    ? `${enquiry.metadata?.vehicle_make || ''} ${enquiry.metadata?.vehicle_model || ''}`.trim()
    : '';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Enquiry</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #001E50; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">${dealer.name}</h1>
    <p style="margin: 10px 0 0 0;">New Enquiry Received</p>
  </div>
  
  <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #001E50;">Customer Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Name:</td>
        <td style="padding: 8px 0;">${enquiry.firstName} ${enquiry.lastName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Email:</td>
        <td style="padding: 8px 0;"><a href="mailto:${enquiry.email}">${enquiry.email}</a></td>
      </tr>
      ${enquiry.phone ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
        <td style="padding: 8px 0;"><a href="tel:${enquiry.phone}">${enquiry.phone}</a></td>
      </tr>
      ` : ''}
      ${enquiry.suburb || enquiry.state ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Location:</td>
        <td style="padding: 8px 0;">${enquiry.suburb || ''}${enquiry.state ? ', ' + enquiry.state : ''} ${enquiry.postcode || ''}</td>
      </tr>
      ` : ''}
    </table>
  </div>
  
  ${vehicleInfo ? `
  <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #001E50;">Vehicle of Interest</h2>
    <p style="margin: 0; font-size: 16px;"><strong>${vehicleInfo}</strong></p>
    ${enquiry.metadata?.vehicle_condition ? `<p style="margin: 5px 0 0 0;">Condition: ${enquiry.metadata.vehicle_condition}</p>` : ''}
    ${enquiry.metadata?.stock_id ? `<p style="margin: 5px 0 0 0;">Stock ID: ${enquiry.metadata.stock_id}</p>` : ''}
  </div>
  ` : ''}
  
  ${enquiry.message ? `
  <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #001E50;">Message</h2>
    <p style="margin: 0; white-space: pre-wrap;">${enquiry.message}</p>
  </div>
  ` : ''}
  
  <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #001E50;">Additional Information</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Enquiry Type:</td>
        <td style="padding: 8px 0;">${enquiry.type}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Received:</td>
        <td style="padding: 8px 0;">${new Date(enquiry.createdAt).toLocaleString('en-AU')}</td>
      </tr>
      ${enquiry.testDrive ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Test Drive:</td>
        <td style="padding: 8px 0;">✓ Requested</td>
      </tr>
      ` : ''}
      ${enquiry.tradeIn ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Trade-In:</td>
        <td style="padding: 8px 0;">✓ Has vehicle to trade</td>
      </tr>
      ` : ''}
      ${enquiry.financeInterest ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Finance:</td>
        <td style="padding: 8px 0;">✓ Interested in finance</td>
      </tr>
      ` : ''}
    </table>
  </div>
  
  <div style="text-align: center; padding: 20px; background: #001E50;">
    <a href="${dealer.websiteUrl || 'https://salehyundai.com.au'}/admin/enquiries/${enquiry.id}" 
       style="display: inline-block; background: white; color: #001E50; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
      View in Dashboard
    </a>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
    <p>This is an automated notification from ${dealer.name} Enquiry Management System</p>
  </div>
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
 */
function generateCustomerConfirmationHTML(enquiry: any, dealer: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #001E50; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">${dealer.name}</h1>
    <p style="margin: 10px 0 0 0;">Thank You For Your Enquiry</p>
  </div>
  
  <div style="padding: 30px 20px;">
    <p>Hi ${enquiry.firstName},</p>
    
    <p>Thank you for contacting ${dealer.name}. We've received your enquiry and one of our team members will be in touch shortly.</p>
    
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #001E50;">
      <h3 style="margin-top: 0;">Your Enquiry Details</h3>
      <p><strong>Reference:</strong> ${enquiry.id.substring(0, 8)}</p>
      <p><strong>Type:</strong> ${enquiry.type}</p>
      <p><strong>Submitted:</strong> ${new Date(enquiry.createdAt).toLocaleString('en-AU')}</p>
    </div>
    
    <p>In the meantime, feel free to contact us directly:</p>
    <ul>
      ${dealer.phone ? `<li><strong>Phone:</strong> <a href="tel:${dealer.phone}">${dealer.phone}</a></li>` : ''}
      ${dealer.email ? `<li><strong>Email:</strong> <a href="mailto:${dealer.email}">${dealer.email}</a></li>` : ''}
      ${dealer.address ? `<li><strong>Address:</strong> ${dealer.address}${dealer.suburb ? ', ' + dealer.suburb : ''}${dealer.state ? ', ' + dealer.state : ''} ${dealer.postcode || ''}</li>` : ''}
    </ul>
    
    <p>We look forward to assisting you!</p>
    
    <p>Best regards,<br>
    <strong>The ${dealer.name} Team</strong></p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd;">
    <p>${dealer.name}<br>
    ${dealer.address || ''} ${dealer.suburb || ''} ${dealer.state || ''} ${dealer.postcode || ''}<br>
    ${dealer.phone || ''} | ${dealer.email || ''}<br>
    <a href="${dealer.websiteUrl || ''}" style="color: #001E50;">${dealer.websiteUrl || ''}</a></p>
  </div>
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


