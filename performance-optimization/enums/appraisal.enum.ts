export enum AppraisalStatus {
  DRAFT = 'Draft',          // Manager is still filling the appraisal
  IN_PROGRESS = 'In Progress', // Manager is working on it
  SUBMITTED = 'Submitted',  // Manager submitted to HR
  PUBLISHED = 'Published',  // HR published to employee
  DISPUTED = 'Disputed',    // Employee raised dispute
  RESOLVED = 'Resolved',    // HR resolved the dispute
  ARCHIVED = 'Archived',    // Finalized and archived
}