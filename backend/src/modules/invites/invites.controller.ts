import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequireAdmin } from '../users/require-admin.guard';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InviteResponseDto } from './dto/invite-response.dto';
import { InvitesService } from './invites.service';

@ApiTags('invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @RequireAdmin()
  @ApiCreatedResponse({ type: InviteResponseDto })
  @ApiForbiddenResponse({
    description: 'Caller is not an admin.',
  })
  createInvite(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateInviteDto,
  ) {
    return this.invitesService.createInvite(request.userId!, dto);
  }
}
