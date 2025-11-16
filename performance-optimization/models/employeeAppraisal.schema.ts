import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AppraisalStatus } from 'src/enums/appraisal.enum';
import { AppealStatus } from 'src/enums/appeal.enum';


@Schema({ timestamps: true })
export class EmployeeAppraisal {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  managerId: string;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalCycle', required: true })
  cycleId: string;

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
            examples: { type: String },
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
      examples?: string;
    }[];
  }[];

  @Prop()
  overallScore: number; // calculated

  @Prop()
  finalComment: string; // manager summary

 @Prop({
  type: {
    raised: { type: Boolean, default: false },
    description: { type: String },
    resolution: { type: String },
    status: { type: String, enum: AppealStatus, default: AppealStatus.PENDING },
  },
})
 objection?: {
  raised: boolean;
  description?: string;
  resolution?: string;
  status: AppealStatus;
};


@Prop({
  type: String,
  enum: AppraisalStatus,
  default: AppraisalStatus.DRAFT,
})
appraisalStatus: AppraisalStatus;

}



