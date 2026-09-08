import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    count: jest.Mock;
  };
};

function createMockPrisma(): MockPrismaService {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrismaService;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('password hashing', () => {
    it('hashes a password and can verify it back', async () => {
      const hash = await service.hashPassword('correct-password');

      expect(hash).not.toEqual('correct-password');
      await expect(
        service.verifyPassword('correct-password', hash),
      ).resolves.toBe(true);
      await expect(
        service.verifyPassword('wrong-password', hash),
      ).resolves.toBe(false);
    });
  });

  describe('findByEmail / findById', () => {
    it('looks up a user by email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      await service.findByEmail('alice@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'alice@example.com' },
      });
    });

    it('looks up a user by id', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      await service.findById('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });

  describe('buildCreateUserOperation', () => {
    it('builds a user creation operation with the given fields', () => {
      prisma.user.create.mockReturnValue('create-op');

      const result = service.buildCreateUserOperation({
        email: 'alice@example.com',
        name: 'Alice',
        passwordHash: 'hashed',
        role: Role.member,
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'alice@example.com',
          name: 'Alice',
          passwordHash: 'hashed',
          role: Role.member,
        }) as unknown,
      });
      expect(result).toBe('create-op');
    });
  });

  describe('ensureBootstrapAdmin', () => {
    it('does nothing when users already exist', async () => {
      prisma.user.count.mockResolvedValue(1);

      await service.ensureBootstrapAdmin();

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('creates an admin from env vars when no users exist', async () => {
      prisma.user.count.mockResolvedValue(0);
      process.env.SEED_ADMIN_EMAIL = 'admin@example.com';
      process.env.SEED_ADMIN_PASSWORD = 'a-good-password';
      process.env.SEED_ADMIN_NAME = 'Admin';
      let createData:
        | { email: string; name: string; role: Role; passwordHash: string }
        | undefined;
      prisma.user.create.mockImplementation(
        ({
          data,
        }: {
          data: {
            email: string;
            name: string;
            role: Role;
            passwordHash: string;
          };
        }) => {
          createData = data;
          return Promise.resolve(data);
        },
      );

      await service.ensureBootstrapAdmin();

      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(createData?.email).toBe('admin@example.com');
      expect(createData?.name).toBe('Admin');
      expect(createData?.role).toBe(Role.admin);
      expect(createData?.passwordHash).not.toEqual('a-good-password');
    });

    it('skips creation when no users exist but env vars are missing', async () => {
      prisma.user.count.mockResolvedValue(0);
      delete process.env.SEED_ADMIN_EMAIL;
      delete process.env.SEED_ADMIN_PASSWORD;
      delete process.env.SEED_ADMIN_NAME;

      await service.ensureBootstrapAdmin();

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });
});
