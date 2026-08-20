import { UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    process.env.APP_PASSWORD = 'correct-password';

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('issues a token when the password matches APP_PASSWORD', async () => {
    const result = await service.login('correct-password');

    expect(result.accessToken).toEqual(expect.any(String));
  });

  it('throws when the password does not match APP_PASSWORD', async () => {
    await expect(service.login('wrong-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
