import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type AppraisalHistoryDocument = HydratedDocument<AppraisalHistory>;

@Schema({ timestamps: true })
export class AppraisalHistory {
  @Prop({ required: true, unique: true })
  history_id: string;            // pk

  @Prop({ required: true })
  employee_id: string;

  @Prop({ required: true })
  appraisal_id: string;

  @Prop({ required: true })
  cycle_id: string;

  @Prop({ required: true })
  archived_at: Date;           // timestamp

  @Prop({ required: true })
  final_rating: number;          // numeric

  @Prop({ type: Object })
  snapshot_data: any;            // json (could also define a type)
}

export const AppraisalHistorySchema = SchemaFactory.createForClass(AppraisalHistory);
