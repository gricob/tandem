import { ApiProperty } from '@nestjs/swagger';

export class FormResponseResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() formId!: string;
  @ApiProperty({
    description: 'Saved field values, keyed by field id.',
    type: 'object',
    additionalProperties: true,
  })
  responseData!: Record<string, unknown>;
  @ApiProperty({
    description: 'Whether every required field has a saved value.',
  })
  isComplete!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
