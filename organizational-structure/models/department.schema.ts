import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DepartmentDocument = HydratedDocument<Department>;

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true })
  departmentId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  departmentCode: string;

  @Prop({ default: true })
  isActive: boolean;

  // @Prop()
  // deactivatedAt?: Date;
  // //phase 3: "delimited — closed as of a certain date".

  @Prop()
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Position' }] })
  positions?: Types.ObjectId[];
  //natural relation (many to many): each department contains many positions (Phase 1).
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
