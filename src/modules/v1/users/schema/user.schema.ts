import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;
@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ unique: true, lowercase: true })
  email: string;

  @Prop({ default: null })
  firstName: string;

  @Prop({ default: null })
  lastName: string;

  @Prop({ default: false })
  suspended: boolean;

  @Prop({ default: false })
  deleted: boolean;

  @Prop({ select: false })
  password: string;
}
const UserSchema = SchemaFactory.createForClass(User).set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

export default UserSchema;
