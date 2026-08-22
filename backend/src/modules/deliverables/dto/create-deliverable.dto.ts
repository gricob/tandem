import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeliverableDto {
  @ApiProperty({ description: 'Name of the deliverable.' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the deliverable.' })
  @IsOptional()
  @IsString()
  description?: string;
}
