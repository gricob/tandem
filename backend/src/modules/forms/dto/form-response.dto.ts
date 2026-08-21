import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FormResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() formTypeId!: string;
  @ApiProperty({ description: "The source form type's name." })
  formTypeName!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description!:
    string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
