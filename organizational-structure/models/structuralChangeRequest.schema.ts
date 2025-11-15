import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema()
export class StructuralChangeRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedBy: Types.ObjectId;
  //REQ-OSM-03: Manager submits.

  @Prop({ type: Types.ObjectId, ref: 'Position', required: true })
  targetPosition: Types.ObjectId;
  //what position the manager wants to modify.

  @Prop({ enum: ['CHANGE_REPORTING_LINE', 'MOVE_TO_DEPARTMENT'], required: true })
  requestType: string;
  //From REQ-OSM-03: changes to reporting lines or team assignments.

  @Prop({ type: Types.ObjectId, ref: 'Position' })
  newReportsTo?: Types.ObjectId;
  //If they want to change the reporting manager.

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  newDepartment?: Types.ObjectId;
  //If they want to move the position to another department.

  @Prop({ enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' })
  status: string;
  //REQ-OSM-04: Admin reviews and approves.

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;
  //Who approved/rejected it (System Admin).

  @Prop()
  reviewedAt?: Date;

  @Prop()
  reason?: string;
  //optional comment from manager or admin.

  @Prop({ default: Date.now })
  createdAt: Date;
}
export const StructuralChangeRequestSchema =
  SchemaFactory.createForClass(StructuralChangeRequest);
