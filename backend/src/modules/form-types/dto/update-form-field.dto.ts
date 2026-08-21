import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateFormFieldDto {
  @ApiPropertyOptional({ description: 'Label shown for the field.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  label?: string;

  @ApiPropertyOptional({
    enum: FormFieldType,
    description: 'Data type of the field.',
  })
  @IsOptional()
  @IsEnum(FormFieldType)
  fieldType?: FormFieldType;

  @ApiPropertyOptional({
    description: 'Whether the field must be filled in to complete a response.',
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description:
      'Available options. Required (non-empty) for `select`/`multi_select`; must be null/omitted otherwise.',
    type: [String],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  options?: string[] | null;
}
