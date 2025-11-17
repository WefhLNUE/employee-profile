import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { EmploymentType, CorrectionStatus, Role } from '../enums/employee.enum';
import { BasePerson } from './person.schema';

export type EmployeeDocument = HydratedDocument<Employee>

@Schema({ timestamps: true })
export class Employee extends BasePerson {
  //basics
  @Prop({ required: true, unique: true })
  employeeId: string;

  //education (BR 3h)
  @Prop({
    type: [
      {
        degree: String,
        fieldOfStudy: String,
        institution: String,
        graduationYear: Number,
      },
    ],
    default: [],
  })
  education: {
    degree: string;
    fieldOfStudy: string;
    institution: string;
    graduationYear: number;
  }[];

  //job and department (Org Structure input)
  @Prop()
  department?: string; //import from rom Org Structure module

  @Prop()
  position?: string; //import from org Structure module

  //full time/part time/...
  @Prop({
    type: String,
    enum: EmploymentType,
    default: EmploymentType.FULL_TIME,
  })
  employmentType: EmploymentType;

  @Prop()
  hireDate?: Date;

  @Prop()
  workReceivingDate?: Date; // For leave accrual calculations (BR requirement)

  // Manager relationship (BR 3d, 3e, BR 41b)
  @Prop()
  reportsTo?: string; // Manager employeeId

  // Status (BR 3j)
  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  deactivatedAt?: Date;

  //Performance Data (import from Performance module) - BR 16
  @Prop({
    type: [
      {
        appraisalId: String,
        date: Date,
        type: String,
        score: Number,
        cycleId: String,
      },
    ],
    default: [],
  })
  appraisalHistory: {
    appraisalId: string;
    date: Date;
    type: string;
    score: number;
    cycleId: string;
  }[];

  //(??)
  //correction requests (US-E6-02)
  @Prop({
  type: [
    {
      fieldName: String,
      oldValue: String,
      requestedValue: String,
      status: {
        type: String,
        enum: Object.values(CorrectionStatus),
        default: CorrectionStatus.PENDING,
      },
      requestedAt: { type: Date, default: Date.now },
      reviewedAt: Date,
      reviewedBy: String, // HR Manager who reviewed
      rejectionReason: String, // If rejected
    },
  ],
  default: [],
})
pendingCorrectionRequests: {
  fieldName: string;
  oldValue: string;
  requestedValue: string;
  status: CorrectionStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}[];

  // Audit Trail (BR 22)
  @Prop({
    type: [
      {
        action: String,
        field: String,
        oldValue: String,
        newValue: String,
        changedBy: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  auditLog: {
    action: string;
    field: string;
    oldValue: string;
    newValue: string;
    changedBy: string;
    timestamp: Date;
  }[];

  //role (BR 20a)
  @Prop({
  type: String,
  enum: Object.values(Role),
  default: Role.EMPLOYEE,
  })
  role: Role;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
