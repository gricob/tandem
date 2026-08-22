import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserStoryDto {
  @ApiProperty({
    description: 'Id of the form template this user story is created from.',
  })
  @IsString()
  @IsNotEmpty()
  formTemplateId!: string;

  @ApiProperty({ description: 'Name of the user story.' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the user story.' })
  @IsOptional()
  @IsString()
  description?: string;
}
