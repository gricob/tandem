import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  applyDecorators,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { UsersService } from './users.service';

@Injectable()
export class RequireAdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.userId) {
      throw new UnauthorizedException('Missing session token.');
    }

    const user = await this.usersService.findById(request.userId);
    if (!user || user.role !== Role.admin) {
      throw new ForbiddenException('Only admins can perform this action.');
    }

    return true;
  }
}

export const RequireAdmin = () => applyDecorators(UseGuards(RequireAdminGuard));
