import { Status } from '../../enums/employee.enum.ts';
import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class AppraisalCycle {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    type: String,
    enum: Status,   // <-- Use your global enum here
    default: Status.PENDING,
  })
  status: Status;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true })
  templateId: string;

  @Prop({
    type: [
      {
        employeeId: { type: String, required: true },
        managerId: { type: String, required: true },
      },
    ],
    default: [],
  })
  assignments: {
    employeeId: string;
    managerId: string;
  }[];

  @Prop({ default: false })
  publishedToEmployees: boolean;
}
