import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AppraisalHistoryDocument = HydratedDocument<AppraisalHistory>;

@Schema({ timestamps: true })
export class AppraisalHistory {
  @Prop({ required: true, unique: true })
  historyId: string; // pk

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appraisal', required: true })
  appraisalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalCycle', required: true })
  cycleId: Types.ObjectId;

  @Prop({ required: true })
  archivedAt: Date; // timestamp

  @Prop({ required: true })
  finalRating: number; // numeric

  @Prop({ type: Object })
  snapshotData: any; // Complete snapshot of the appraisal at time of archiving

  // Additional metadata
  @Prop()
  appraisalType?: string;

  @Prop()
  cycleName?: string;

  @Prop()
  reviewedBy?: string; // Manager name/ID

  @Prop({ default: false })
  hasDispute: boolean;

  @Prop()
  disputeResolution?: string;
}

export const AppraisalHistorySchema = SchemaFactory.createForClass(AppraisalHistory);

// Indexes for performance
AppraisalHistorySchema.index({ historyId: 1 });
AppraisalHistorySchema.index({ employeeId: 1 });
AppraisalHistorySchema.index({ cycleId: 1 });
AppraisalHistorySchema.index({ archivedAt: -1 });
AppraisalHistorySchema.index({ employeeId: 1, archivedAt: -1 }); // For employee history queries
