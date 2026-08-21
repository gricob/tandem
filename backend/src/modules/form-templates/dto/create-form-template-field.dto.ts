import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { FormFieldType } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFormTemplateFieldDto {
  @ApiProperty({ description: 'Label shown for the field.' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ enum: FormFieldType, description: 'Data type of the field.' })
  @IsEnum(FormFieldType)
  fieldType!: FormFieldType;

  @ApiPropertyOptional({
    description: 'Whether the field must be filled in to complete a response.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description:
      'Available options. Required (non-empty) for `select`/`multi_select`; must be omitted otherwise.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  options?: string[];
}
