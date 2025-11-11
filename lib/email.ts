/**
 * Email sending utility using Resend
 * 
 * Requires RESEND_API_KEY environment variable
 */

import { Resend } from 'resend';
import { CATEGORY_MAPPINGS } from '@/config';

// Email "from" address - update this to your verified domain in production
// For development, Resend allows using onboarding@resend.dev
const EMAIL_FROM = process.env.EMAIL_FROM || 'Eden Valley Poultry - Evening Shift <onboarding@resend.dev>';

// Lazy initialization of Resend to avoid errors during build
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured. Please add it to your .env.local file.');
  }
  return new Resend(apiKey);
}

export interface EmailData {
  category: string;
  recipientEmail: string;
  recipientName: string;
  workerName: string | null;
  workerEmail: string | null;
  topic: string;
  message: string;
  timestamp: string;
  isAnonymous?: boolean;
}

/**
 * Formats and sends an email to the recipient
 */
export async function sendEmail(data: EmailData): Promise<void> {
  const categoryMapping = CATEGORY_MAPPINGS.find(c => c.label === data.category);
  
  if (!categoryMapping) {
    throw new Error(`Invalid category: ${data.category}`);
  }

  const isAnonymous = data.isAnonymous || data.category === 'Anonymous Company Feedback';
  const subject = isAnonymous 
    ? `[Night Shift] Anonymous Feedback: ${data.topic}`
    : `[Night Shift] ${data.topic} - ${data.category}`;
  
  // Professional email format - looks like a real email
  const body = isAnonymous ? `
═══════════════════════════════════════════════════════════
TOPIC: ${data.topic.toUpperCase()}
═══════════════════════════════════════════════════════════

${data.message}

---
This message was submitted anonymously through the EVP Evening Message Sender system to encourage open and honest feedback. The sender's identity has been protected.

Submitted: ${data.timestamp}
Category: ${data.category}

If you have any questions or need clarification, please note that this was submitted anonymously and direct response is not available.

Best regards,
EVP Evening Shift Team
  `.trim() : `
═══════════════════════════════════════════════════════════
TOPIC: ${data.topic.toUpperCase()}
═══════════════════════════════════════════════════════════

${data.message}

${data.workerName ? `\nBest regards,\n${data.workerName}` : '\nBest regards,\nEvening Shift Team'}
${data.workerEmail ? `\n${data.workerEmail}` : ''}
${categoryMapping.phoneExt ? `\nPhone Extension: ${categoryMapping.phoneExt}` : ''}

---
Submitted via EVP Evening Message Sender
Date: ${data.timestamp}
Department: ${data.category}
  `.trim();

  const resend = getResend();

  // Set Reply-To to sender's email if provided, otherwise use a no-reply address
  const replyTo = !isAnonymous && data.workerEmail 
    ? data.workerEmail 
    : undefined;

  // BCC the sender so they get a copy of the email in their inbox
  // This allows them to track the conversation thread
  const bcc = !isAnonymous && data.workerEmail 
    ? [data.workerEmail]
    : undefined;

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.recipientEmail,
      subject,
      text: body,
      ...(replyTo && { reply_to: replyTo }),
      ...(bcc && { bcc: bcc }),
    });
    
    if (result.error) {
      console.error('Resend API error:', result.error);
      throw new Error(`Failed to send email: ${result.error.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to send email. Please check your RESEND_API_KEY and try again.');
  }
}


