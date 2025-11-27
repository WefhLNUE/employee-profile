import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeProfileController } from './employee-profile.controller';
import { EmployeeProfileService } from './employee-profile.service';

import { Candidate, CandidateSchema } from './models/candidate.schema';
import { EmployeeProfile, EmployeeProfileSchema } from './models/employee-profile.schema';
import { EmployeeSystemRole, EmployeeSystemRoleSchema } from './models/employee-system-role.schema';
import {
  EmployeeProfileChangeRequest,
  EmployeeProfileChangeRequestSchema,
} from './models/ep-change-request.schema';
import { EmployeeQualification, EmployeeQualificationSchema } from './models/qualification.schema';
import { CounterSchema } from './models/counter.schema';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([
      { name: Candidate.name, schema: CandidateSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      {
        name: EmployeeProfileChangeRequest.name,
        schema: EmployeeProfileChangeRequestSchema,
      },
      { name: 'Counter', schema: CounterSchema },
      { name: EmployeeQualification.name, schema: EmployeeQualificationSchema },
    ]),
  ],
  controllers: [EmployeeProfileController],
  providers: [EmployeeProfileService, RolesGuard],

  // ✅ FIX: Export the service so AuthModule can use it
  exports: [EmployeeProfileService],
})
export class EmployeeProfileModule {}
