import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateFormDto {
  @ApiPropertyOptional({ description: 'Name of the form.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the form.' })
  @IsOptional()
  @IsString()
  description?: string;
}
