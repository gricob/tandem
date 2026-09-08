import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'Invite token received out of band.' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: 'Email address the invite was issued to.' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: "The new account's password." })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: "The new account's display name." })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
