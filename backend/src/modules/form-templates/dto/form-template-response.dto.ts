import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormTemplateFieldResponseDto } from './form-template-field-response.dto';

export class FormTemplateResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description!:
    string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [FormTemplateFieldResponseDto] })
  templateFields!: FormTemplateFieldResponseDto[];
}
