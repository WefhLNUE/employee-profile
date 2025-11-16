import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type AppraisalCriteriaDocument = HydratedDocument<AppraisalCriteria>;

@Schema({ timestamps: true })
export class AppraisalCriteria {
  @Prop({ required: true, unique: true })
  criteria_id: string;           // pk

  @Prop({ required: true })
  template_id: string;

  @Prop({ required: true })
  criteria_name: string;

  @Prop({ required: true })
  criteria_weight: number;       // numeric

  @Prop()
  description: string;
}

export const AppraisalCriteriaSchema = SchemaFactory.createForClass(AppraisalCriteria);
