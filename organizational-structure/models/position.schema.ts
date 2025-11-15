import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PositionDocument = HydratedDocument<Position>;

@Schema({ timestamps: true })
export class Position {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  code: string;
  //"Identification codes" for positions (Phase 1)
  //-> called departmentCode in department.schema.ts

  @Prop()
  reportsTo?: string;
  //department postions

  @Prop({ required: true })
  payGrade: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  deactivatedAt?: Date;
  //phase 3: delimit positions instead of deleting.

  @Prop()
  validFrom?: Date;

  @Prop()
  validTo?: Date;
  //useful to maintain structural history (Phase 3).
}

export const PositionSchema = SchemaFactory.createForClass(Position);
