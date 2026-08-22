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
import { AcceptanceCriteriaService } from './acceptance-criteria.service';
import { AcceptanceCriterionResponseDto } from './dto/acceptance-criterion-response.dto';
import { CreateAcceptanceCriterionDto } from './dto/create-acceptance-criterion.dto';
import { ReorderAcceptanceCriteriaDto } from './dto/reorder-acceptance-criteria.dto';

@ApiTags('acceptance-criteria')
@Controller('user-stories/:userStoryId/acceptance-criteria')
export class AcceptanceCriteriaController {
  constructor(
    private readonly acceptanceCriteriaService: AcceptanceCriteriaService,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: AcceptanceCriterionResponseDto })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  addAcceptanceCriterion(
    @Param('userStoryId') userStoryId: string,
    @Body() dto: CreateAcceptanceCriterionDto,
  ) {
    return this.acceptanceCriteriaService.addAcceptanceCriterion(
      userStoryId,
      dto,
    );
  }

  @Put('order')
  @ApiOkResponse({ type: [AcceptanceCriterionResponseDto] })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  reorderAcceptanceCriteria(
    @Param('userStoryId') userStoryId: string,
    @Body() dto: ReorderAcceptanceCriteriaDto,
  ) {
    return this.acceptanceCriteriaService.reorderAcceptanceCriteria(
      userStoryId,
      dto.acceptanceCriteriaIds,
    );
  }

  @Delete(':acceptanceCriterionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  removeAcceptanceCriterion(
    @Param('userStoryId') userStoryId: string,
    @Param('acceptanceCriterionId') acceptanceCriterionId: string,
  ) {
    return this.acceptanceCriteriaService.removeAcceptanceCriterion(
      userStoryId,
      acceptanceCriterionId,
    );
  }
}
