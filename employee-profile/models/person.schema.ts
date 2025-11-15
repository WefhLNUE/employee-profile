import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class BasePerson {

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
  emailOfficial: string;

  @Prop()
  emailPersonal?: string;

  @Prop({ required: true })
  password: string; // Should be hashed before saving

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({
    type: {
      street: String,
      city: String,
      country: String,
      postalCode: String,
    }
  })
  address: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };

  @Prop()
  profilePhoto?: string;

  @Prop()
  bio?: string;

  @Prop()
  gender?: string;

  @Prop()
  dateOfBirth?: Date;
}
