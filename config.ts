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

