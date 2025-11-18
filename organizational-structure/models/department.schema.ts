import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DepartmentDocument = HydratedDocument<Department>;

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true, unique: true })
  departmentId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  departmentCode: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  deactivatedAt?: Date; // BR 12, BR 37: "delimited — closed as of a certain date"

  @Prop()
  description?: string;

  // Hierarchical structure
  @Prop({ type: Types.ObjectId, ref: 'Department', required: false })
  parentDepartment?: Types.ObjectId; // Parent department ID

 @Prop({ type: Types.ObjectId, ref: 'DepartmentManager' })
  departmentHead?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Position' }], default: [] })
  positions: Types.ObjectId[]; //to store positionId that we created


  // @Prop({ type: [{ type: Types.ObjectId, ref: 'Position' }] })
  // positions?: Types.ObjectId[];
  //natural relation (many to many): each department contains many positions (Phase 1).
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
