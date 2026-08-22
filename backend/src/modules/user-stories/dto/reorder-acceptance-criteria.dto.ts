import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderAcceptanceCriteriaDto {
  @ApiProperty({
    description:
      "Ordered list of acceptance criterion ids: must contain exactly the user story's current acceptance criterion ids, in the desired order.",
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  acceptanceCriteriaIds!: string[];
}
