import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class SaveFormResponseDto {
  @ApiProperty({
    description:
      'Field values to save, keyed by field id. Only include the ids being set; ' +
      'ids not present keep their previously saved value. Set a value to null to clear that field.',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  responseData!: Record<string, unknown>;
}
