import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type AppraisalDisputeDocument = HydratedDocument<AppraisalDispute>;

@Schema({ timestamps: true })
export class AppraisalDispute {
  @Prop({ required: true, unique: true })
  dispute_id: string;            // pk

  @Prop({ required: true })
  appraisal_id: string;

  @Prop({ required: true })
  employee_id: string;

  @Prop({ required: true })
  dispute_reason: string;

  @Prop({ required: true, default: Date.now })
  submitted_at: Date;          // timestamp (ISO string)

  @Prop({ default: null })
  reviewed_by: string | null;    // nullable if not reviewed yet

  @Prop({ default: null })
  resolution: string | null;

  @Prop({ default: null })
  resolution_comments: string | null;

  @Prop({ default: null })
  resolved_at: Date | null;    // timestamp or null

  @Prop({ required: true })
  status: string;
}

export const AppraisalDisputeSchema = SchemaFactory.createForClass(AppraisalDispute);
