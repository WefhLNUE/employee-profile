import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AppraisalCycleType } from '../enums/appraisalCycle.enum';
import { AppraisalStatus } from '../enums/appraisal.enum';

@Schema({ timestamps: true })
export class AppraisalCycle {
  @Prop({ required: true, unique: true })
  cycleId: string;

  @Prop({ required: true })
  cycleName: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  submissionDeadline?: Date; // Deadline for managers to submit

  @Prop()
  publicationDate?: Date; // When results are published to employees

  @Prop({
    type: String,
    enum: Object.values(AppraisalStatus),
    default: AppraisalStatus.DRAFT,
  })
  status: AppraisalStatus;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true })
  templateId: Types.ObjectId;

  @Prop({ required: true, enum: AppraisalCycleType })
  cycleType: AppraisalCycleType;

  // Departments and employees included in this cycle
  @Prop({ type: [String], default: [] })
  departments?: string[]; // Department IDs

  @Prop({ type: [String], default: [] })
  employees?: string[]; // Employee IDs

  @Prop({ required: true })
  createdBy: string; // HR Manager or HR Employee ID

  @Prop({ default: false })
  isPublished: boolean;

  @Prop()
  publishedAt?: Date;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop()
  archivedAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const AppraisalCycleSchema = SchemaFactory.createForClass(AppraisalCycle);