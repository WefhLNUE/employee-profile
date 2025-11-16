import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BasePerson } from '../models/person.schema';

export type ManagerTeamViewDocument = HydratedDocument<ManagerTeamView>;

@Schema({ timestamps: true })
export class ManagerTeamView extends BasePerson {

  @Prop({ required: true, unique: true })
  managerId: string; // refers to Employee.employeeId is FK

  @Prop({ required: true })
  managerPosition: string; // from Org Structure

  @Prop({ required: true })
  managerDepartment: string;

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
