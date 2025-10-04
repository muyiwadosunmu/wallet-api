import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { User, UserDocument } from '../../users/schema/user.schema';

export type WalletDocument = Wallet & Document;
@Schema({ timestamps: true, versionKey: false })
export class Wallet {
  @Prop({ unique: true, lowercase: true })
  address: string;

  @Prop({ select: false })
  privateKey: string;

  @Prop({ default: '' })
  balance: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name })
  user: UserDocument;

  @Prop()
  mnemonic: string;

  @Prop({ select: false })
  hashedMnemonic: string;

  @Prop({ default: 'sepolia' })
  network: string;

  @Prop({ default: false })
  isDeleted: boolean;
}
const WalletSchema = SchemaFactory.createForClass(Wallet).set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

export default WalletSchema;
