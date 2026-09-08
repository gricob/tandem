import { BadRequestException, Injectable } from '@nestjs/common';
import { Invite } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { ulid } from 'ulid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvite(
    createdByUserId: string,
    dto: CreateInviteDto,
  ): Promise<Invite & { token: string }> {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);

    const invite = await this.prisma.invite.create({
      data: {
        id: ulid(),
        email: dto.email,
        tokenHash,
        role: dto.role,
        createdByUserId,
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
      },
    });

    return { ...invite, token };
  }

  async findValidInvite(token: string, email: string): Promise<Invite> {
    const tokenHash = this.hashToken(token);
    const invite = await this.prisma.invite.findUnique({
      where: { tokenHash },
    });

    if (!invite) {
      throw new BadRequestException('Invalid invite token.');
    }
    if (invite.usedAt) {
      throw new BadRequestException('This invite has already been used.');
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This invite has expired.');
    }
    if (invite.email !== email) {
      throw new BadRequestException(
        'This invite was issued for a different email address.',
      );
    }

    return invite;
  }

  buildMarkUsedOperation(inviteId: string) {
    return this.prisma.invite.update({
      where: { id: inviteId },
      data: { usedAt: new Date() },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
