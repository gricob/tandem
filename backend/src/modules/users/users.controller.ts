import { Controller, Get, NotFoundException, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { MeResponseDto } from './dto/me-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({
    description: 'The currently authenticated user.',
    type: MeResponseDto,
  })
  async me(@Req() request: AuthenticatedRequest): Promise<MeResponseDto> {
    const user = await this.usersService.findById(request.userId!);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
