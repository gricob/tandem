import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InvitesService } from '../invites/invites.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly invitesService: InvitesService,
    private readonly prisma: PrismaService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await this.usersService.verifyPassword(
      password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.issueToken(user.id);
  }

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const invite = await this.invitesService.findValidInvite(
      dto.token,
      dto.email,
    );

    const passwordHash = await this.usersService.hashPassword(dto.password);

    const [user] = await this.prisma.$transaction([
      this.usersService.buildCreateUserOperation({
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: invite.role,
      }),
      this.invitesService.buildMarkUsedOperation(invite.id),
    ]);

    return this.issueToken(user.id);
  }

  private async issueToken(userId: string): Promise<{ accessToken: string }> {
    const accessToken = await this.jwtService.signAsync({ sub: userId });
    return { accessToken };
  }
}
