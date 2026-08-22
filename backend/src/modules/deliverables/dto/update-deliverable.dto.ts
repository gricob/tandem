import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDeliverableDto {
  @ApiPropertyOptional({ description: 'Name of the deliverable.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the deliverable.' })
  @IsOptional()
  @IsString()
  description?: string;
}
