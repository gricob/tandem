import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class MeResponseDto {
  @ApiProperty({ description: "The current user's id." })
  id!: string;

  @ApiProperty({ description: "The current user's email address." })
  email!: string;

  @ApiProperty({ description: "The current user's display name." })
  name!: string;

  @ApiProperty({ description: "The current user's role.", enum: Role })
  role!: Role;
}
