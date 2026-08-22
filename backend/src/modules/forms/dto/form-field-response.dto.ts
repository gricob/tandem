import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormFieldType } from '@prisma/client';
import type { ConditionNode } from '../../../condition/condition.types';

export class FormFieldResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() formId!: string;
  @ApiProperty() label!: string;
  @ApiProperty({ enum: FormFieldType }) fieldType!: FormFieldType;
  @ApiProperty() isRequired!: boolean;
  @ApiPropertyOptional({ type: [String], nullable: true }) options!:
    string[] | null;
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  condition!: ConditionNode | null;
  @ApiProperty() orderIndex!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
