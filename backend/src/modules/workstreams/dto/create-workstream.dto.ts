import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkstreamDto {
  @ApiProperty({ description: 'Name of the workstream.' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the workstream.' })
  @IsOptional()
  @IsString()
  description?: string;
}
