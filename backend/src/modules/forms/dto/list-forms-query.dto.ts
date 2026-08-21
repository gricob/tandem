import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListFormsQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive substring filter on the form name.',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
