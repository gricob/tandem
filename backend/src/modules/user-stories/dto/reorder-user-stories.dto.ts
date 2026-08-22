import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderUserStoriesDto {
  @ApiProperty({
    description:
      "Ordered list of user story ids: must contain exactly the deliverable's current user story ids, in the desired order.",
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userStoryIds!: string[];
}
