import { Injectable, Logger } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ulid } from 'ulid';
import { PrismaService } from '../../prisma/prisma.service';

const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  }

  verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  buildCreateUserOperation(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: Role;
  }) {
    return this.prisma.user.create({
      data: {
        id: ulid(),
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role,
      },
    });
  }

  async ensureBootstrapAdmin(): Promise<void> {
    const userCount = await this.prisma.user.count();
    if (userCount > 0) {
      return;
    }

    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    const name = process.env.SEED_ADMIN_NAME;

    if (!email || !password || !name) {
      this.logger.warn(
        'No users exist and SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD/SEED_ADMIN_NAME are not fully set; skipping bootstrap admin creation.',
      );
      return;
    }

    const passwordHash = await this.hashPassword(password);
    await this.prisma.user.create({
      data: {
        id: ulid(),
        email,
        name,
        passwordHash,
        role: Role.admin,
      },
    });
    this.logger.log(`Created bootstrap admin user ${email}.`);
  }
}
