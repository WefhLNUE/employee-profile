// export enum AppraisalStatus {
//   DRAFT = 'Draft',          // Manager is still filling the appraisal
//   SUBMITTED = 'Submitted',  // Manager submitted to HR
//   PUBLISHED = 'Published',  // HR published to employee
// }

export enum AppraisalStatus {
  PENDING = 'Pending',      // Employee raised appeal, HR must review
  RESOLVED = 'Resolved',    // HR resolved the objection
  REJECTED = 'Rejected',    // (Optional) HR rejected the appeal (if your process allows)
}