import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFormTemplateDto {
  @ApiProperty({ description: 'Name of the form template.' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the form template.' })
  @IsOptional()
  @IsString()
  description?: string;
}
