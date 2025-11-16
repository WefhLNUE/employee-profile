import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AppraisalStatus } from '../enums/appraisal.enum';


@Schema({ timestamps: true })
export class EmployeeAppraisal {
  @Prop({ type: Types.ObjectId, ref: 'AppraisalCycle', required: true })
  cycleId: string;

  @Prop({
    type: [
      {
        employeeId: { type: String, required: true },
        managerId: { type: String, required: true },
      },
    ],
    default: [],
  })
  assignments: {
    employeeId: string;
    managerId: string;
  }[];

  // @Prop({ required: true })
  // employeeId: string;

  // @Prop({ required: true })
  // managerId: string;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true })
  templateId: string;

  @Prop({
    type: [
      {
        sectionTitle: { type: String, required: true },
        ratings: [
          {
            questionText: { type: String, required: true },
            ratingValue: { type: Number, required: true },
            managerComment: { type: String },
            managerExamples: { type: String },
            managerRecommendations: { type: String },
            attendance_score: {type: Number},
            punctuality_score: {type: Number},
          },
        ],
      },
    ],
  })
  sections: {
    sectionTitle: string;
    ratings: {
      questionText: string;
      ratingValue: number;
      managerComment?: string;
      managerExamples?: string;
      managerRecommendations?: string;
      attendance_score?: number;
      punctuality_score?: number;
    }[];
  }[];
  //in backend will import from time management module and manager will se it then decide the rating

  @Prop()
  overallScore: number; // calculated

  @Prop()
  finalComment: string; // manager summary

  @Prop({
    required: true,
    enum: AppraisalStatus,
    default: AppraisalStatus.PENDING,
  })
  status: AppraisalStatus;

  @Prop()
  createdAt: Date;
  @Prop()
  updatedAt: Date;
  @Prop()
  submittedAt: Date;
  @Prop() 
  publishedAt: Date;
}

export const EmployeeAppraisalSchema =
  SchemaFactory.createForClass(EmployeeAppraisal);


