import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { EmploymentType, CorrectionStatus, Role } from '../enums/employee.enum';
import { BasePerson } from 'person.schema';

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

  //Performance Data (import from Performance module)
  @Prop({
    type: [
      {
        date: Date,
        type: String,
        score: Number,
      },
    ],
    default: [],
  })
  appraisalHistory: {
    date: Date;
    type: string;
    score: number;
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
      reviewedAt: { type: Date },
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
