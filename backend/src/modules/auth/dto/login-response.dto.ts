import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ description: 'Signed JWT session token.' })
  accessToken!: string;
}
