import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AppraisalDisputeDocument = HydratedDocument<AppraisalDispute>;

export enum DisputeStatus {
  PENDING = 'Pending',
  UNDER_REVIEW = 'Under Review',
  RESOLVED = 'Resolved',
  REJECTED = 'Rejected',
}

@Schema({ timestamps: true })
export class AppraisalDispute {
  @Prop({ required: true, unique: true })
  disputeId: string; // pk

  @Prop({ type: Types.ObjectId, ref: 'Appraisal', required: true })
  appraisalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  disputeReason: string;

  @Prop({ required: true, default: Date.now })
  submittedAt: Date;

  @Prop({
    type: String,
    enum: Object.values(DisputeStatus),
    default: DisputeStatus.PENDING,
  })
  status: DisputeStatus;

  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  reviewedBy?: Types.ObjectId; // HR Manager who reviews

  @Prop()
  resolution?: string;

  @Prop()
  resolutionComments?: string;

  @Prop()
  resolvedAt?: Date;

  // Original vs adjusted rating
  @Prop()
  originalRating?: number;

  @Prop()
  adjustedRating?: number;

  @Prop()
  adjustmentJustification?: string;
}

export const AppraisalDisputeSchema = SchemaFactory.createForClass(AppraisalDispute);

// Indexes for performance
AppraisalDisputeSchema.index({ disputeId: 1 });
AppraisalDisputeSchema.index({ appraisalId: 1 });
AppraisalDisputeSchema.index({ employeeId: 1 });
AppraisalDisputeSchema.index({ status: 1 });
AppraisalDisputeSchema.index({ submittedAt: -1 });
