import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateFormTypeDto {
  @ApiPropertyOptional({ description: 'Name of the form type.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the form type.' })
  @IsOptional()
  @IsString()
  description?: string;
}
