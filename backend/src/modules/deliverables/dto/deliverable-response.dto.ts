import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStoryResponseDto } from '../../user-stories/dto/user-story-response.dto';

export class DeliverableResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description!:
    string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [UserStoryResponseDto] })
  userStories!: UserStoryResponseDto[];
}
