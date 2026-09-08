import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

function contextWithAuthHeader(authorization?: string): {
  context: ExecutionContext;
  request: { headers: { authorization?: string }; userId?: string };
} {
  const request: { headers: { authorization?: string }; userId?: string } = {
    headers: { authorization },
  };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
  return { context, request };
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

  it('allows a request with a valid token and attaches the user id', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = await jwtService.signAsync({ sub: 'user-1' });
    const { context, request } = contextWithAuthHeader(`Bearer ${token}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.userId).toBe('user-1');
  });

  it('rejects a request with no Authorization header', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = contextWithAuthHeader(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a request with an invalid token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = contextWithAuthHeader('Bearer not-a-real-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a request with an expired token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = await jwtService.signAsync(
      { sub: 'user-1' },
      { expiresIn: '-1s' },
    );
    const { context } = contextWithAuthHeader(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows a route marked @Public() without a token', async () => {
    const getAllAndOverride = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);
    const { context } = contextWithAuthHeader(undefined);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(getAllAndOverride).toHaveBeenCalledWith(
      IS_PUBLIC_KEY,
      expect.any(Array),
    );
  });
});
