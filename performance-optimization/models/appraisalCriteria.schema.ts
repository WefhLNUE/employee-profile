import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AppraisalCriteriaDocument = HydratedDocument<AppraisalCriteria>;

@Schema({ timestamps: true })
export class AppraisalCriteria {
  @Prop({ required: true, unique: true })
  criteriaId: string; // pk

  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true })
  templateId: Types.ObjectId;

  @Prop({ required: true })
  criteriaName: string;

  @Prop({ required: true })
  criteriaWeight: number; // Percentage weight (0-100)

  @Prop()
  description?: string;

  @Prop()
  minScore?: number;

  @Prop()
  maxScore?: number;
}

export const AppraisalCriteriaSchema =
  SchemaFactory.createForClass(AppraisalCriteria);

// Indexes for performance
AppraisalCriteriaSchema.index({ criteriaId: 1 });
AppraisalCriteriaSchema.index({ templateId: 1 });

