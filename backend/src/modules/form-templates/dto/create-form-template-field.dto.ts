import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { FormFieldType } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import type { ConditionNode } from '../../../condition/condition.types';

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

  @ApiPropertyOptional({
    description:
      'Visibility condition tree. Referenced fields must belong to the same ' +
      "form template, operators must match the referenced field's type, and " +
      'the reference graph must stay acyclic. Omitted means always visible.',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  condition?: ConditionNode;
}
