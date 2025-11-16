import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Timestamp } from 'rxjs';

@Schema({ timestamps: true })
export class AppraisalTemplate {
  @Prop({required: true, unique: true})
  templateId: string;

  @Prop({ required: true })
  templateName: string; // e.g., "Annual General Appraisal", "Probation Template"

  @Prop({
    type: [
      {
        label: { type: String, required: true }, // e.g., Excellent, Satisfactory
        value: { type: Number, required: true }, // e.g., 5,4,3,2,1
        criteria: { type: String, required: true }, // description of the rating
      },
    ],
  })
  ratingScale: {
    label: string;
    value: number;
    criteria: string;
  }[];

  @Prop({ type: Types.ObjectId, ref: 'HRManager', required: true })
  createdBy: string; // HRManager who created the template

  @Prop({required: true})
  updatedAt: Date;

  @Prop({required: true})
  isActive: boolean;
}
export const AppraisalTemplateSchema = SchemaFactory.createForClass(AppraisalTemplate);
