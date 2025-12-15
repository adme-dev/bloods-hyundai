/**
 * Staff Invitation Email Utility
 * Handles sending invitation and activation emails to staff members
 */

import sgMail from '@sendgrid/mail';
import { db } from './db';
import { emailLogs } from '../database/schema';
import crypto from 'crypto';

// Initialize SendGrid
let sendGridInitialized = false;

function initSendGrid() {
  if (sendGridInitialized) return true;
  
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (apiKey) {
    sgMail.setApiKey(apiKey);
    sendGridInitialized = true;
    return true;
  }
  
  console.warn('⚠️ SendGrid API key not configured - emails will be logged only');
  return false;
}

/**
 * Generate a secure invitation token
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get invitation token expiry (7 days from now)
 */
export function getInvitationTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
}

export interface StaffInvitationEmailData {
  recipientEmail: string;
  recipientName: string;
  inviterName: string;
  dealerName: string;
  role: string;
  activationLink: string;
  expiresIn: string;
}

/**
 * Send staff invitation email
 */
export async function sendStaffInvitationEmail(
  data: StaffInvitationEmailData,
  dealerId: string
): Promise<boolean> {
  const isSendGridAvailable = initSendGrid();
  
  const subject = `You're invited to join ${data.dealerName}`;
  const html = generateInvitationEmailHTML(data);
  const text = generateInvitationEmailText(data);
  
  console.log('📧 Sending staff invitation email:');
  console.log('To:', data.recipientEmail);
  console.log('Subject:', subject);
  
  try {
    if (isSendGridAvailable) {
      const msg: sgMail.MailDataRequired = {
        to: data.recipientEmail,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@salehyundai.com.au',
          name: data.dealerName,
        },
        subject,
        html,
        text,
      };
      
      const [response] = await sgMail.send(msg);
      
      console.log(`✅ Invitation email sent via SendGrid (${response.statusCode})`);
      
      // Log to database
      await db.insert(emailLogs).values({
        dealerId,
        templateId: 'staff-invitation',
        recipientEmail: data.recipientEmail,
        recipientType: 'staff',
        subject,
        status: 'sent',
        sendgridMessageId: response.headers?.['x-message-id'] || null,
        templateData: {
          recipientName: data.recipientName,
          role: data.role,
          inviterName: data.inviterName,
        },
      });
      
      return true;
    } else {
      console.log('⚠️ SendGrid not configured - invitation email logged but not sent');
      console.log('---');
      console.log('Activation Link:', data.activationLink);
      console.log('---');
      
      await db.insert(emailLogs).values({
        dealerId,
        templateId: 'staff-invitation',
        recipientEmail: data.recipientEmail,
        recipientType: 'staff',
        subject,
        status: 'queued',
        templateData: {
          recipientName: data.recipientName,
          role: data.role,
          inviterName: data.inviterName,
          note: 'SendGrid not configured - email was not sent',
          activationLink: data.activationLink,
        },
      });
      
      return true; // Return true so invitation process continues
    }
  } catch (error: any) {
    console.error('❌ Invitation email send failed:', error);
    
    await db.insert(emailLogs).values({
      dealerId,
      templateId: 'staff-invitation',
      recipientEmail: data.recipientEmail,
      recipientType: 'staff',
      subject,
      status: 'failed',
      errorMessage: error?.message || 'Unknown error',
      templateData: {
        error: String(error),
      },
    });
    
    return false;
  }
}

/**
 * Generate HTML invitation email
 */
function generateInvitationEmailHTML(data: StaffInvitationEmailData): string {
  const roleDisplay = formatRole(data.role);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: #001E50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Welcome to ${data.dealerName}</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">You've been invited to join the team</p>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <p style="font-size: 16px;">Hi ${data.recipientName},</p>
    
    <p style="font-size: 16px;"><strong>${data.inviterName}</strong> has invited you to join <strong>${data.dealerName}</strong> as a <strong>${roleDisplay}</strong>.</p>
    
    <p style="font-size: 16px;">Click the button below to set up your password and activate your account:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.activationLink}" 
         style="display: inline-block; background: #001E50; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Activate Your Account
      </a>
    </div>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #001E50;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong>Note:</strong> This invitation link will expire in ${data.expiresIn}. If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #666;">Or copy and paste this URL into your browser:</p>
    <p style="font-size: 12px; color: #888; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
      ${data.activationLink}
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #666; margin: 0;">
      Best regards,<br>
      <strong>The ${data.dealerName} Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>This is an automated message from ${data.dealerName} CRM</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text invitation email
 */
function generateInvitationEmailText(data: StaffInvitationEmailData): string {
  const roleDisplay = formatRole(data.role);
  
  return `
Welcome to ${data.dealerName}
You've been invited to join the team

Hi ${data.recipientName},

${data.inviterName} has invited you to join ${data.dealerName} as a ${roleDisplay}.

Click the link below to set up your password and activate your account:

${data.activationLink}

Note: This invitation link will expire in ${data.expiresIn}. If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The ${data.dealerName} Team

---
This is an automated message from ${data.dealerName} CRM
  `.trim();
}

/**
 * Format role for display
 */
function formatRole(role: string): string {
  const roleLabels: Record<string, string> = {
    dealer_admin: 'Dealer Administrator',
    general_manager: 'General Manager',
    sales_manager: 'Sales Manager',
    sales: 'Sales Consultant',
    finance_manager: 'Finance Manager',
    service_manager: 'Service Manager',
    service_advisor: 'Service Advisor',
    technician: 'Technician',
    parts_manager: 'Parts Manager',
    parts: 'Parts Team Member',
    staff: 'Staff Member',
  };
  return roleLabels[role] || role;
}

/**
 * Send welcome email after activation
 */
export async function sendWelcomeEmail(
  recipientEmail: string,
  recipientName: string,
  dealerName: string,
  loginUrl: string,
  dealerId: string
): Promise<boolean> {
  const isSendGridAvailable = initSendGrid();
  
  const subject = `Welcome to ${dealerName} - Your account is ready`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #001E50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0;">Account Activated!</h1>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #eee; border-radius: 0 0 8px 8px;">
    <p>Hi ${recipientName},</p>
    
    <p>Your account has been successfully activated. You can now log in to access the ${dealerName} CRM.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" 
         style="display: inline-block; background: #001E50; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Log In Now
      </a>
    </div>
    
    <p style="color: #666;">Best regards,<br>The ${dealerName} Team</p>
  </div>
</body>
</html>
  `.trim();
  
  try {
    if (isSendGridAvailable) {
      await sgMail.send({
        to: recipientEmail,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@salehyundai.com.au',
          name: dealerName,
        },
        subject,
        html,
      });
      
      await db.insert(emailLogs).values({
        dealerId,
        templateId: 'staff-welcome',
        recipientEmail,
        recipientType: 'staff',
        subject,
        status: 'sent',
      });
      
      return true;
    }
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}




