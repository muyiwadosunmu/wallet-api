import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Wallet, WalletDocument } from './wallet.schema';
import * as mongoosePaginate from 'mongoose-paginate-v2';

export type WalletTransactionDocument = WalletTransaction & Document;
@Schema({ timestamps: true, versionKey: false })
export class WalletTransaction {
  @Prop()
  hash: string;

  @Prop()
  fromAddress: string;

  @Prop()
  toAddress: string;

  @Prop()
  amount: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Wallet.name })
  wallet: WalletDocument;

  @Prop()
  memo: string;

  @Prop()
  network: string;

  @Prop()
  status: string;
}
const WalletTransactionSchema = SchemaFactory.createForClass(
  WalletTransaction,
).set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

WalletTransactionSchema.plugin(mongoosePaginate);

export default WalletTransactionSchema;
