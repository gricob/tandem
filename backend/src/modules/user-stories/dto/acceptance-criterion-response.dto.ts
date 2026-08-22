import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormFieldResponseDto } from '../../forms/dto/form-field-response.dto';

export class AcceptanceCriterionResponseDto {
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
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [FormFieldResponseDto] })
  fields!: FormFieldResponseDto[];
  @ApiProperty() userStoryId!: string;
  @ApiProperty() orderIndex!: number;
}
