/**
 * Email sending utility using Resend
 * 
 * Requires RESEND_API_KEY environment variable
 */

import { Resend } from 'resend';
import { CATEGORY_MAPPINGS } from '@/config';

// Email "from" address - update this to your verified domain in production
// For development, Resend allows using onboarding@resend.dev
const EMAIL_FROM = process.env.EMAIL_FROM || 'EVP - Night Shift <onboarding@resend.dev>';

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
  // Subject should show sender name, not category name
  const senderName = isAnonymous 
    ? 'Anonymous'
    : (data.workerName || 'Night Shift Team');
  const subject = isAnonymous 
    ? `[Night Shift] Anonymous Feedback: ${data.topic}`
    : `[Night Shift] ${data.topic} - ${senderName}`;
  
  // Extract the actual message content (after greeting)
  const extractActualMessage = (fullMessage: string): { greeting: string; actualMessage: string } => {
    const greetingPattern = /^Dear\s+[^,\n]+,\s*\n\nI hope this message finds you well\. I am writing to you regarding:\s*\n\n/i;
    const match = fullMessage.match(greetingPattern);
    
    if (match) {
      return {
        greeting: match[0],
        actualMessage: fullMessage.replace(greetingPattern, '').trim()
      };
    }
    
    // If no standard greeting, check for any "Dear" pattern
    const dearMatch = fullMessage.match(/^(Dear\s+[^,\n]+,\s*\n\n[^\n]+\n\n)/i);
    if (dearMatch) {
      return {
        greeting: dearMatch[0],
        actualMessage: fullMessage.replace(dearMatch[0], '').trim()
      };
    }
    
    // If no greeting found, treat entire message as actual message
    return {
      greeting: '',
      actualMessage: fullMessage.trim()
    };
  };

  const { greeting, actualMessage } = extractActualMessage(data.message);

  // HTML escape function to prevent XSS
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Professional email format - message in bold (topic is in subject, not needed here)
  const htmlBody = isAnonymous ? `
${greeting ? `<p>${escapeHtml(greeting).replace(/\n/g, '<br>')}</p>` : ''}${actualMessage ? `<p><strong>MESSAGE:</strong></p>
<p>${escapeHtml(actualMessage).replace(/\n/g, '<br>')}</p>` : ''}

<hr>
<p>This message was submitted anonymously through the EVP Night Shift Message Sender system to encourage open and honest feedback. The sender's identity has been protected.</p>
<p><small>Submitted: ${escapeHtml(data.timestamp)}<br>Category: ${escapeHtml(data.category)}</small></p>
<p><small>If you have any questions or need clarification, please note that this was submitted anonymously and direct response is not available.</small></p>
  `.trim() : `
${greeting ? `<p>${escapeHtml(greeting).replace(/\n/g, '<br>')}</p>` : ''}${actualMessage ? `<p><strong>MESSAGE:</strong></p>
<p>${escapeHtml(actualMessage).replace(/\n/g, '<br>')}</p>` : ''}

${data.workerName && data.workerEmail ? `<p>${escapeHtml(data.workerName)}<br>${escapeHtml(data.workerEmail)}</p>` : data.workerEmail ? `<p>From: ${escapeHtml(data.workerEmail)}</p>` : ''}
${categoryMapping.phoneExt ? `<p>Phone Extension: ${escapeHtml(categoryMapping.phoneExt)}</p>` : ''}

<hr>
<p><small>Submitted via EVP Night Shift Message Sender<br>Date: ${escapeHtml(data.timestamp)}</small></p>
  `.trim();

  // Plain text version for email clients that don't support HTML
  const textBody = isAnonymous ? `
${greeting ? greeting : ''}${actualMessage ? `MESSAGE:

${actualMessage}` : ''}

---
This message was submitted anonymously through the EVP Night Shift Message Sender system to encourage open and honest feedback. The sender's identity has been protected.

Submitted: ${data.timestamp}
Category: ${data.category}

If you have any questions or need clarification, please note that this was submitted anonymously and direct response is not available.
  `.trim() : `
${greeting ? greeting : ''}${actualMessage ? `MESSAGE:

${actualMessage}` : ''}

${data.workerName && data.workerEmail ? `${data.workerName}\n${data.workerEmail}` : data.workerEmail ? `From: ${data.workerEmail}` : ''}
${categoryMapping.phoneExt ? `Phone Extension: ${categoryMapping.phoneExt}` : ''}

---
Submitted via EVP Night Shift Message Sender
Date: ${data.timestamp}
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
      html: htmlBody,
      text: textBody,
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


