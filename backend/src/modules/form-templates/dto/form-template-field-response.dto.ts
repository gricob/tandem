import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormFieldType } from '@prisma/client';

export class FormTemplateFieldResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() formTemplateId!: string;
  @ApiProperty() label!: string;
  @ApiProperty({ enum: FormFieldType }) fieldType!: FormFieldType;
  @ApiProperty() isRequired!: boolean;
  @ApiPropertyOptional({ type: [String], nullable: true }) options!:
    string[] | null;
  @ApiProperty() orderIndex!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
