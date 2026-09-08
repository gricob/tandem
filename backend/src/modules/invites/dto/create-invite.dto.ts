import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateInviteDto {
  @ApiProperty({ description: 'Email address the invite is issued to.' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Role the new account will be granted on registration.',
    enum: Role,
  })
  @IsEnum(Role)
  role!: Role;
}
