import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InvitesService } from './invites.service';

type MockPrismaService = {
  invite: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

function createMockPrisma(): MockPrismaService {
  return {
    invite: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('InvitesService', () => {
  let service: InvitesService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [InvitesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<InvitesService>(InvitesService);
  });

  describe('createInvite', () => {
    it('creates an invite with a hashed token and returns the raw token once', async () => {
      prisma.invite.create.mockImplementation(({ data }: { data: unknown }) =>
        Promise.resolve({ id: 'invite-1', ...(data as object) }),
      );

      const result = await service.createInvite('admin-1', {
        email: 'alice@example.com',
        role: Role.member,
      });

      expect(prisma.invite.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'alice@example.com',
          role: Role.member,
          createdByUserId: 'admin-1',
        }) as unknown,
      });
      expect(result.token).toEqual(expect.any(String));
      expect(result).not.toHaveProperty('tokenHash', result.token);
    });
  });

  describe('findValidInvite', () => {
    async function createdToken(
      overrides: Partial<Record<string, unknown>> = {},
    ) {
      const created = await service.createInvite('admin-1', {
        email: 'alice@example.com',
        role: Role.member,
      });
      return {
        token: created.token,
        stored: {
          id: 'invite-1',
          email: 'alice@example.com',
          role: Role.member,
          tokenHash: created.tokenHash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          usedAt: null,
          ...overrides,
        },
      };
    }

    it('returns the invite when the token is valid, unused, unexpired, and email matches', async () => {
      prisma.invite.create.mockImplementation(({ data }: { data: unknown }) =>
        Promise.resolve({ id: 'invite-1', ...(data as object) }),
      );
      const { token, stored } = await createdToken();
      prisma.invite.findUnique.mockResolvedValue(stored);

      await expect(
        service.findValidInvite(token, 'alice@example.com'),
      ).resolves.toEqual(stored);
    });

    it('rejects an unknown token', async () => {
      prisma.invite.findUnique.mockResolvedValue(null);

      await expect(
        service.findValidInvite('unknown-token', 'alice@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an already-used invite', async () => {
      prisma.invite.create.mockImplementation(({ data }: { data: unknown }) =>
        Promise.resolve({ id: 'invite-1', ...(data as object) }),
      );
      const { token, stored } = await createdToken({ usedAt: new Date() });
      prisma.invite.findUnique.mockResolvedValue(stored);

      await expect(
        service.findValidInvite(token, 'alice@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an expired invite', async () => {
      prisma.invite.create.mockImplementation(({ data }: { data: unknown }) =>
        Promise.resolve({ id: 'invite-1', ...(data as object) }),
      );
      const { token, stored } = await createdToken({
        expiresAt: new Date(Date.now() - 1000),
      });
      prisma.invite.findUnique.mockResolvedValue(stored);

      await expect(
        service.findValidInvite(token, 'alice@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an email that does not match the invite', async () => {
      prisma.invite.create.mockImplementation(({ data }: { data: unknown }) =>
        Promise.resolve({ id: 'invite-1', ...(data as object) }),
      );
      const { token, stored } = await createdToken();
      prisma.invite.findUnique.mockResolvedValue(stored);

      await expect(
        service.findValidInvite(token, 'someone-else@example.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('buildMarkUsedOperation', () => {
    it('marks the invite used', () => {
      prisma.invite.update.mockReturnValue('update-op');

      const result = service.buildMarkUsedOperation('invite-1');

      expect(prisma.invite.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: { usedAt: expect.any(Date) as unknown },
      });
      expect(result).toBe('update-op');
    });
  });
});
