import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormFieldResponseDto } from './form-field-response.dto';

export class FormTypeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description!:
    string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [FormFieldResponseDto] })
  fields!: FormFieldResponseDto[];
}
