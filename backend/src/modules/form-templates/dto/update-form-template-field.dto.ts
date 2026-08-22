import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateFormTemplateFieldDto {
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

  @ApiPropertyOptional({
    description:
      'Visibility condition tree. Referenced fields must belong to the same ' +
      "form template, operators must match the referenced field's type, and " +
      'the reference graph must stay acyclic. Set to null to make the field ' +
      'always visible.',
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  condition?: ConditionNode | null;
}
