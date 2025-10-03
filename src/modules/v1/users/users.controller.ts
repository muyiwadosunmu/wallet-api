import { Controller, Get } from '@nestjs/common';
import { APIRes } from 'src/core/common/api-response';
import { Protected } from 'src/core/decorators/access.decorator';
import { LoggedInUser } from 'src/core/decorators/logged-in-decorator';
import { UserDocument } from './schema/user.schema';

@Controller('v1/users')
export class UsersController {
  constructor() {}

  @Get('me')
  @Protected()
  findOne(@LoggedInUser() user: UserDocument) {
    return APIRes(user, 'User details fetched');
  }
}
