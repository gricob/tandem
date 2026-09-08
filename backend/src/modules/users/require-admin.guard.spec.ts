import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { RequireAdminGuard } from './require-admin.guard';
import { UsersService } from './users.service';

function contextWithUserId(userId?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ userId }),
    }),
  } as unknown as ExecutionContext;
}

describe('RequireAdminGuard', () => {
  let guard: RequireAdminGuard;
  let usersService: { findById: jest.Mock };

  beforeEach(async () => {
    usersService = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequireAdminGuard,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    guard = module.get<RequireAdminGuard>(RequireAdminGuard);
  });

  it('allows an admin user through', async () => {
    usersService.findById.mockResolvedValue({ id: 'user-1', role: Role.admin });

    await expect(guard.canActivate(contextWithUserId('user-1'))).resolves.toBe(
      true,
    );
  });

  it('rejects a member user', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      role: Role.member,
    });

    await expect(
      guard.canActivate(contextWithUserId('user-1')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects when there is no authenticated user id', async () => {
    await expect(
      guard.canActivate(contextWithUserId(undefined)),
    ).rejects.toThrow(UnauthorizedException);
  });
});
