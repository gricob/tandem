import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(password: string): Promise<{ accessToken: string }> {
    if (password !== process.env.APP_PASSWORD) {
      throw new UnauthorizedException('Invalid password.');
    }

    const accessToken = await this.jwtService.signAsync({ sub: 'shared' });
    return { accessToken };
  }
}
