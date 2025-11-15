//REQ-OSM-11: system must notify managers and stakeholders when structural change occurs.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema()
export class OrgNotification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient: Types.ObjectId;
  // To whom the notification is sent.

  @Prop({ required: true })
  message: string;
  // Description of the change.

  @Prop({ type: Types.ObjectId, ref: 'StructuralChangeRequest' })
  relatedRequest?: Types.ObjectId;
  // If triggered by a manager change request.

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}
export const OrgNotificationSchema = SchemaFactory.createForClass(OrgNotification);
