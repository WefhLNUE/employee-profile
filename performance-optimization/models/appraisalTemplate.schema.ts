import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class AppraisalTemplate {
  @Prop({ required: true })
  name: string; // e.g., "Annual General Appraisal", "Probation Template"

  @Prop({
    type: [
      {
        label: { type: String, required: true }, // e.g., Excellent, Satisfactory
        value: { type: Number, required: true }, // e.g., 5,4,3,2,1
        description: { type: String },
      },
    ],
  })
  ratingScale: {
    label: string;
    value: number;
    description?: string;
  }[];

  @Prop({
    type: [
      {
        sectionTitle: { type: String, required: true }, // e.g., "Job Knowledge", "Leadership"
        weight: { type: Number, required: true }, // 0–100
        questions: [
          {
            questionText: { type: String, required: true }, // “Rate communication skills”
            weight: { type: Number, required: true },
          },
        ],
      },
    ],
  })
  sections: {
    sectionTitle: string;
    weight: number;
    questions: {
      questionText: string;
      weight: number;
    }[];
  }[];

  @Prop({
    type: [String],
    default: [],
  })
  applicableDepartments: string[]; // OS dependency

  @Prop({
    type: [String],
    default: [],
  })
  applicableJobGrades: string[]; // OS dependency
}
