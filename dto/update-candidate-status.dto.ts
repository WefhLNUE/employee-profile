import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CandidateStatus } from '../enums/employee-profile.enums';

export class UpdateCandidateStatusDto {
  @IsEnum(CandidateStatus)
  status: CandidateStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
