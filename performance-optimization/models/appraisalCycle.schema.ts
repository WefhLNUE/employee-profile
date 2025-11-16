import { CorrectionStatus } from '../../employee-profile/enums/employee.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AppraisalCycleType } from '../enums/appraisalCycle.enum';

@Schema({ timestamps: true })
export class AppraisalCycle {
  @Prop({ required: true, unique: true })
  cycleId: string;

  @Prop({ required: true })
  cycleName: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    type: String,
    enum: CorrectionStatus,   // <-- Use your global enum here
    default: CorrectionStatus.PENDING,
  })
  status: CorrectionStatus;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true })
  templateId: string;

  @Prop({ required: true, enum: AppraisalCycleType })
  cycle_type: AppraisalCycleType;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ default: false })
  publishedToEmployees: boolean;
}

export const AppraisalCycleSchema = SchemaFactory.createForClass(AppraisalCycle);