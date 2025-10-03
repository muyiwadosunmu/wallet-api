import { UserDocument } from 'src/modules/v1/users/schema/user.schema';

export enum ResponseStatus {
  SUCCESS = 'success',
  FAIL = 'fail',
}

export class IRequest extends Request {
  user: UserDocument;
}
