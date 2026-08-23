import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderDeliverablesDto {
  @ApiProperty({
    description:
      "Ordered list of deliverable ids: must contain exactly the workstream's current deliverable ids, in the desired order.",
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  deliverableIds!: string[];
}
