import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class InviteResponseDto {
  @ApiProperty({ description: 'Identifier of the invite.' })
  id!: string;

  @ApiProperty({ description: 'Email address the invite was issued to.' })
  email!: string;

  @ApiProperty({
    description: 'Role the new account will be granted on registration.',
    enum: Role,
  })
  role!: Role;

  @ApiProperty({
    description:
      'One-time invite token. Only returned here; not recoverable afterwards.',
  })
  token!: string;

  @ApiProperty({ description: 'When the invite stops being usable.' })
  expiresAt!: Date;

  @ApiProperty({ description: 'When the invite was created.' })
  createdAt!: Date;
}
