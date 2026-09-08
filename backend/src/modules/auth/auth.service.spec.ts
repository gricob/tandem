import { UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InvitesService } from '../invites/invites.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    verifyPassword: jest.Mock;
    hashPassword: jest.Mock;
    buildCreateUserOperation: jest.Mock;
  };
  let invitesService: {
    findValidInvite: jest.Mock;
    buildMarkUsedOperation: jest.Mock;
  };
  let prisma: { $transaction: jest.Mock };

  const user = {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    passwordHash: 'hashed',
    role: Role.member,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      verifyPassword: jest.fn(),
      hashPassword: jest.fn(),
      buildCreateUserOperation: jest.fn(),
    };
    invitesService = {
      findValidInvite: jest.fn(),
      buildMarkUsedOperation: jest.fn(),
    };
    prisma = { $transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: InvitesService, useValue: invitesService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('issues a token when the email and password match a user', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      usersService.verifyPassword.mockResolvedValue(true);

      const result = await service.login(user.email, 'correct-password');

      expect(result.accessToken).toEqual(expect.any(String));
    });

    it('throws when no user matches the email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('unknown@example.com', 'anything'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when the password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      usersService.verifyPassword.mockResolvedValue(false);

      await expect(service.login(user.email, 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('validates the invite, creates the user, marks the invite used, and issues a token', async () => {
      const invite = {
        id: 'invite-1',
        email: user.email,
        role: Role.member,
      };
      invitesService.findValidInvite.mockResolvedValue(invite);
      usersService.hashPassword.mockResolvedValue('hashed-password');
      usersService.buildCreateUserOperation.mockReturnValue('create-user-op');
      invitesService.buildMarkUsedOperation.mockReturnValue('mark-used-op');
      prisma.$transaction.mockResolvedValue([user, invite]);

      const result = await service.register({
        token: 'raw-token',
        email: user.email,
        password: 'a-good-password',
        name: user.name,
      });

      expect(invitesService.findValidInvite).toHaveBeenCalledWith(
        'raw-token',
        user.email,
      );
      expect(usersService.buildCreateUserOperation).toHaveBeenCalledWith({
        email: user.email,
        name: user.name,
        passwordHash: 'hashed-password',
        role: invite.role,
      });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        'create-user-op',
        'mark-used-op',
      ]);
      expect(result.accessToken).toEqual(expect.any(String));
    });

    it('propagates an invalid invite without creating a user', async () => {
      invitesService.findValidInvite.mockRejectedValue(
        new Error('invalid invite'),
      );

      await expect(
        service.register({
          token: 'bad-token',
          email: user.email,
          password: 'a-good-password',
          name: user.name,
        }),
      ).rejects.toThrow('invalid invite');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
