import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BasePerson } from './person.schema';

export type DepartmentManagerDocument = HydratedDocument<DepartmentManager>;

@Schema({ timestamps: true })
export class DepartmentManager extends BasePerson {

  @Prop({ required: true, unique: true })
  managerId: string;
  
  @Prop({ type: Types.ObjectId, ref: 'Position', required: true })
  managerPosition: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  managerDepartment: Types.ObjectId;


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

export const DepartmentManagerSchema = SchemaFactory.createForClass(DepartmentManager);
