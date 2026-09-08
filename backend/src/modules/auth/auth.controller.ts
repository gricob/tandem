import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Email and password matched an account; returns a session token.',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Email/password did not match an existing account.',
  })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Invite was valid; account created and a session token returned.',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invite token is unknown, used, expired, or email mismatched.',
  })
  register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(registerDto);
  }
}
