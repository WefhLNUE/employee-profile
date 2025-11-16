import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ManagerTeamViewDocument = HydratedDocument<ManagerTeamView>;

@Schema({ timestamps: true })
export class ManagerTeamView {

  @Prop({ required: true })
  managerId: string; // refers to Employee.employeeId is FK

  @Prop({ required: true })
  managerPosition: string; // from Org Structure

  @Prop({ required: true })
  managerDepartment: string;

  @Prop({
    type: [
      {
        employeeId: String,
        firstName: String,
        lastName: String,
        emailOfficial: String,
        position: String,
        department: String,
        payGrade: String,   // BR 10c
      },
    ],
    default: [],
  })
  teamMembers: {
    employeeId: string;
    firstName: string;
    lastName: string;
    emailOfficial: string;
    position: string;
    department: string;
    payGrade: string; // NOT salary; allowed by privacy rule
  }[];

  // --- Summary Section for Manager Insight ---
  @Prop({
    type: {
      totalTeamSize: Number,
      positionsCount: Object,   
      departmentsCount: Object, 
      payGradesCount: Object,   
    },
    default: {},
  })
  summary: {
    totalTeamSize: number;
    positionsCount: Record<string, number>;
    departmentsCount: Record<string, number>;
    payGradesCount: Record<string, number>;
  };

  @Prop({
    type: [
      {
        employeeId: String,
        supervisorId: String, // direct supervisor link from Org Structure
      }
    ],
    default: [],
  })
  reportingLines: {
    employeeId: string;
    supervisorId: string;
  }[];

  // --- Flags / Metadata ---
  @Prop({ default: false })
  syncedFromOrgStructure: boolean; // indicates last refresh

}

export const ManagerTeamViewSchema = SchemaFactory.createForClass(ManagerTeamView);
