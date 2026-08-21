import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormFieldResponseDto } from './form-field-response.dto';

export class FormResponseDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) formTemplateId!:
    string | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      "The source form template's name, or null if that template was deleted.",
  })
  formTemplateName!: string | null;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description!:
    string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [FormFieldResponseDto] })
  fields!: FormFieldResponseDto[];
}
