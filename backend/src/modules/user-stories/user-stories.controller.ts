import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserStoryDto } from './dto/create-user-story.dto';
import { ReorderUserStoriesDto } from './dto/reorder-user-stories.dto';
import { UserStoryResponseDto } from './dto/user-story-response.dto';
import { UserStoriesService } from './user-stories.service';

@ApiTags('user-stories')
@Controller('deliverables/:deliverableId/user-stories')
export class UserStoriesController {
  constructor(private readonly userStoriesService: UserStoriesService) {}

  @Post()
  @ApiCreatedResponse({ type: UserStoryResponseDto })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  addUserStory(
    @Param('deliverableId') deliverableId: string,
    @Body() dto: CreateUserStoryDto,
  ) {
    return this.userStoriesService.addUserStory(deliverableId, dto);
  }

  @Put('order')
  @ApiOkResponse({ type: [UserStoryResponseDto] })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  reorderUserStories(
    @Param('deliverableId') deliverableId: string,
    @Body() dto: ReorderUserStoriesDto,
  ) {
    return this.userStoriesService.reorderUserStories(
      deliverableId,
      dto.userStoryIds,
    );
  }

  @Delete(':userStoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  removeUserStory(
    @Param('deliverableId') deliverableId: string,
    @Param('userStoryId') userStoryId: string,
  ) {
    return this.userStoriesService.removeUserStory(deliverableId, userStoryId);
  }
}
