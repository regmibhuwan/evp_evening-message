/**
 * Configuration for EVP Evening Message Sender
 * 
 * Category mappings and system settings
 */

export interface CategoryMapping {
  label: string;
  recipientName: string;
  email: string;
  phoneExt: string;
}

export const CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    label: "Anonymous Company Feedback",
    recipientName: "Management",
    email: "regmibhuwan555@gmail.com",
    phoneExt: ""
  },
  {
    label: "Payroll / CFO Inquiry",
    recipientName: "Payroll Department",
    email: "regmibhuwan555@gmail.com",
    phoneExt: ""
  },
  {
    label: "Business Operations",
    recipientName: "Operations Team",
    email: "regmibhuwan555@gmail.com",
    phoneExt: ""
  },
  {
    label: "People Services (HR)",
    recipientName: "HR Department",
    email: "regmibhuwan555@gmail.com",
    phoneExt: ""
  },
  {
    label: "General Inquiry",
    recipientName: "Office Staff",
    email: "regmibhuwan555@gmail.com",
    phoneExt: ""
  }
];

/**
 * Set to true to require supervisor approval before sending emails
 * When true, messages are stored and supervisor must approve before sending
 */
export const REQUIRE_SUPERVISOR_APPROVAL = false;

/**
 * Supervisor email for approval notifications
 * Only used if REQUIRE_SUPERVISOR_APPROVAL is true
 */
export const SUPERVISOR_EMAIL = "supervisor@edenvalleypoultry.com";

