import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { CreateDeliverableDto } from '../deliverables/dto/create-deliverable.dto';
import { DeliverableResponseDto } from '../deliverables/dto/deliverable-response.dto';
import { CreateWorkstreamDto } from './dto/create-workstream.dto';
import { ReorderDeliverablesDto } from './dto/reorder-deliverables.dto';
import { UpdateWorkstreamDto } from './dto/update-workstream.dto';
import { WorkstreamResponseDto } from './dto/workstream-response.dto';
import { WorkstreamsService } from './workstreams.service';

@ApiTags('workstreams')
@Controller('workstreams')
export class WorkstreamsController {
  constructor(private readonly workstreamsService: WorkstreamsService) {}

  @Post()
  @ApiCreatedResponse({ type: WorkstreamResponseDto })
  createWorkstream(@Body() dto: CreateWorkstreamDto) {
    return this.workstreamsService.createWorkstream(dto);
  }

  @Get()
  @ApiOkResponse({ type: [WorkstreamResponseDto] })
  findAllWorkstreams() {
    return this.workstreamsService.findAllWorkstreams();
  }

  @Get(':workstreamId')
  @ApiOkResponse({ type: WorkstreamResponseDto })
  @ApiNotFoundResponse()
  getWorkstream(@Param('workstreamId') workstreamId: string) {
    return this.workstreamsService.getWorkstream(workstreamId);
  }

  @Patch(':workstreamId')
  @ApiOkResponse({ type: WorkstreamResponseDto })
  @ApiNotFoundResponse()
  updateWorkstream(
    @Param('workstreamId') workstreamId: string,
    @Body() dto: UpdateWorkstreamDto,
  ) {
    return this.workstreamsService.updateWorkstream(workstreamId, dto);
  }

  @Delete(':workstreamId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  deleteWorkstream(@Param('workstreamId') workstreamId: string) {
    return this.workstreamsService.deleteWorkstream(workstreamId);
  }

  @Post(':workstreamId/deliverables')
  @ApiCreatedResponse({ type: DeliverableResponseDto })
  @ApiNotFoundResponse()
  addDeliverable(
    @Param('workstreamId') workstreamId: string,
    @Body() dto: CreateDeliverableDto,
  ) {
    return this.workstreamsService.addDeliverable(workstreamId, dto);
  }

  @Put(':workstreamId/deliverables/order')
  @ApiOkResponse({ type: [DeliverableResponseDto] })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  reorderDeliverables(
    @Param('workstreamId') workstreamId: string,
    @Body() dto: ReorderDeliverablesDto,
  ) {
    return this.workstreamsService.reorderDeliverables(
      workstreamId,
      dto.deliverableIds,
    );
  }
}
