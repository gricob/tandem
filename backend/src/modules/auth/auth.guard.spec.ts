import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

function contextWithAuthHeader(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization } }),
    }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      providers: [AuthGuard],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('allows a request with a valid token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = await jwtService.signAsync({ sub: 'shared' });

    await expect(
      guard.canActivate(contextWithAuthHeader(`Bearer ${token}`)),
    ).resolves.toBe(true);
  });

  it('rejects a request with no Authorization header', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    await expect(
      guard.canActivate(contextWithAuthHeader(undefined)),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a request with an invalid token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    await expect(
      guard.canActivate(contextWithAuthHeader('Bearer not-a-real-token')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a request with an expired token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = await jwtService.signAsync(
      { sub: 'shared' },
      { expiresIn: '-1s' },
    );

    await expect(
      guard.canActivate(contextWithAuthHeader(`Bearer ${token}`)),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('allows a route marked @Public() without a token', async () => {
    const getAllAndOverride = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);

    await expect(
      guard.canActivate(contextWithAuthHeader(undefined)),
    ).resolves.toBe(true);
    expect(getAllAndOverride).toHaveBeenCalledWith(
      IS_PUBLIC_KEY,
      expect.any(Array),
    );
  });
});
