import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AppraisalStatus } from '../enums/appraisal.enum';


@Schema({ timestamps: true })
export class EmployeeAppraisal {
  @Prop({ required: true, unique: true })
  appraisalId: string; // Unique identifier

  @Prop({ type: Types.ObjectId, ref: 'AppraisalCycle', required: true })
  cycleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DepartmentManager', required: true })
  reviewedBy: Types.ObjectId; // Manager who reviews

  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true })
  templateId: Types.ObjectId;

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
            attendanceScore: {type: Number}, // From Time Management module
            punctualityScore: {type: Number}, // From Time Management module
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
      attendanceScore?: number;
      punctualityScore?: number;
    }[];
  }[];
  //in backend will import from time management module and manager will se it then decide the rating

  @Prop()
  overallRating?: number; // Calculated overall rating

  @Prop()
  overallComments?: string; // Manager summary

  @Prop({
    type: [
      {
        recommendation: String,
        priority: String, // HIGH, MEDIUM, LOW
        targetDate: Date,
      },
    ],
    default: [],
  })
  developmentRecommendations: {
    recommendation: string;
    priority: string;
    targetDate?: Date;
  }[];

  @Prop({
    required: true,
    enum: AppraisalStatus,
    default: AppraisalStatus.DRAFT,
  })
  status: AppraisalStatus;

  @Prop()
  submittedAt?: Date;

  @Prop()
  publishedAt?: Date;

  @Prop()
  acknowledgedAt?: Date; // When employee acknowledged the results

  // Dispute information
  @Prop({ type: Types.ObjectId, ref: 'AppraisalDispute' })
  disputeId?: Types.ObjectId;

  @Prop({ default: false })
  hasDispute: boolean;
}

export const EmployeeAppraisalSchema =
  SchemaFactory.createForClass(EmployeeAppraisal);


