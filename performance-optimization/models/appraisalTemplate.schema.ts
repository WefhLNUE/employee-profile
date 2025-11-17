import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class AppraisalTemplate {
  @Prop({required: true, unique: true})
  templateId: string;

  @Prop({ required: true })
  templateName: string; // e.g., "Annual General Appraisal", "Probation Template"

  @Prop()
  description?: string;

  @Prop({
    type: [
      {
        label: { type: String, required: true }, // e.g., Excellent, Satisfactory
        value: { type: Number, required: true }, // e.g., 5,4,3,2,1
        criteria: [
          {
            criteriaName: { type: String, required: true },
            criteriaWeight: { type: Number, required: true },
            description: String,
            minScore: Number,
            maxScore: Number,
          },
        ],
      },
    ],
  })
  ratingScale: {
    label: string;
    value: number;
    criteria: {
      criteriaName: string;
      criteriaWeight: number;
      description?: string;
      minScore?: number;
      maxScore?: number;
    }[];
  }[];

  // Departments/positions this template applies to
  @Prop({ type: [String], default: [] })
  assignedDepartments?: string[]; // Department IDs

  @Prop({ type: [String], default: [] })
  assignedPositions?: string[]; // Position IDs

  @Prop({ type: Types.ObjectId, ref: 'HRManager', required: true })
  createdBy: Types.ObjectId; // HRManager who created the template

  @Prop({ default: true })
  isActive: boolean;
}
export const AppraisalTemplateSchema = SchemaFactory.createForClass(AppraisalTemplate);
