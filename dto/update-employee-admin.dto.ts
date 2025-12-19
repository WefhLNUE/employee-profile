import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import {
  ContractType,
  EmployeeStatus,
  WorkType,
  MaritalStatus,
} from '../enums/employee-profile.enums';

export class UpdateEmployeeAdminDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEnum(MaritalStatus) maritalStatus?: MaritalStatus;

  @IsOptional() @IsDateString() contractStartDate?: string;
  @IsOptional() @IsDateString() contractEndDate?: string;

  @IsOptional() @IsEnum(ContractType) contractType?: ContractType;
  @IsOptional() @IsEnum(WorkType) workType?: WorkType;

  @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
  @IsOptional() @IsDateString() statusEffectiveFrom?: string;

  @IsOptional() @IsString() primaryPositionId?: string;
  @IsOptional() @IsString() primaryDepartmentId?: string;
  @IsOptional() @IsString() supervisorPositionId?: string;

  @IsOptional() @IsString() payGradeId?: string;
  @IsOptional() @IsString({ each: true }) permissions?: string[];
  @IsOptional() @IsString({ each: true }) roles?: string[];
}
