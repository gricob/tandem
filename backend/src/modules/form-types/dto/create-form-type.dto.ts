import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFormTypeDto {
  @ApiProperty({ description: 'Name of the form type.' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the form type.' })
  @IsOptional()
  @IsString()
  description?: string;
}
