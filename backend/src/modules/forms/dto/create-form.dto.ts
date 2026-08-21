import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFormDto {
  @ApiProperty({
    description: 'Id of the form type this form is created from.',
  })
  @IsString()
  @IsNotEmpty()
  formTypeId!: string;

  @ApiProperty({ description: 'Name of the form.' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the form.' })
  @IsOptional()
  @IsString()
  description?: string;
}
