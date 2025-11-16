import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DisputeStatus } from '../enums/dispute.enum';

export type AppraisalDisputeDocument = HydratedDocument<AppraisalDispute>;

@Schema({ timestamps: true })
export class AppraisalDispute {

  //filling info about the dispute
  @Prop({ required: true, unique: true })
  disputeId: string; // pk

  @Prop({ type: Types.ObjectId, ref: 'Appraisal', required: true })
  appraisalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  raisedBy: Types.ObjectId;

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

  //resolution info about the dispute

  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  reviewedBy?: Types.ObjectId; // HR Manager who reviews

  @Prop({ type: Types.ObjectId, ref: 'HR' })
  flaggedBy?: Types.ObjectId; // optional HR flag

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
