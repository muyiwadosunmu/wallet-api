import { Body, Controller, Post } from '@nestjs/common';
import { APIRes } from 'src/core/common/api-response';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async create(@Body() createTaskDto: RegisterUserDto) {
    const user = await this.authService.registerUser(createTaskDto);
    return APIRes(user, 'User created');
  }

  @Post('/login')
  async findAll(@Body() body: LoginDto) {
    const data = await this.authService.login(body);
    return APIRes(data, 'Login successful');
  }
}
