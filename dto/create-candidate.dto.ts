export class CreateCandidateDto {
  fullName: string;
  personalEmail: string;
  mobilePhone?: string;

  departmentId?: string;
  positionId?: string;

  resumeUrl?: string;
  notes?: string;
}
