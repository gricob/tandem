import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderFieldsDto {
  @ApiProperty({
    description:
      "Ordered list of field ids: must contain exactly the form type's current field ids, in the desired order.",
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  fieldIds!: string[];
}
