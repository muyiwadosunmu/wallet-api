import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookDocument = Webhook & Document;
@Schema({ timestamps: true, versionKey: false })
export class Webhook {
  @Prop()
  source: string;

  @Prop()
  event: string;

  @Prop()
  ip: string;

  @Prop()
  userAgent: string;

  @Prop({ type: Object })
  data: Record<string, unknown>;
}
const WebhookSchema = SchemaFactory.createForClass(Webhook).set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

export default WebhookSchema;
