import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateFormTemplateDto {
  @ApiPropertyOptional({ description: 'Name of the form template.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the form template.' })
  @IsOptional()
  @IsString()
  description?: string;
}
