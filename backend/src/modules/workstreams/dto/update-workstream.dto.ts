import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWorkstreamDto {
  @ApiPropertyOptional({ description: 'Name of the workstream.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the workstream.' })
  @IsOptional()
  @IsString()
  description?: string;
}
