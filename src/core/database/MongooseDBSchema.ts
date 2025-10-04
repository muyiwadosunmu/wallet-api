import { ModelDefinition } from '@nestjs/mongoose';
import UserSchema, { User } from 'src/modules/v1/users/schema/user.schema';
import WalletSchema, {
  Wallet,
} from 'src/modules/v1/wallets/schema/wallet.schema';
import WalletTransactionSchema, {
  WalletTransaction,
} from 'src/modules/v1/wallets/schema/wallet.transaction.schema';
import WebhookSchema, {
  Webhook,
} from 'src/modules/v1/wallets/schema/webhook.schems';

export const MongoDBSchema: ModelDefinition[] = [
  {
    name: User.name,
    schema: UserSchema,
  },
  {
    name: Wallet.name,
    schema: WalletSchema,
  },
  {
    name: WalletTransaction.name,
    schema: WalletTransactionSchema,
  },
  {
    name: Webhook.name,
    schema: WebhookSchema,
  },
];
