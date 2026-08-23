import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DeliverableResponseDto } from './dto/deliverable-response.dto';
import { UpdateDeliverableDto } from './dto/update-deliverable.dto';
import { DeliverablesService } from './deliverables.service';

@ApiTags('deliverables')
@Controller('deliverables')
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Get(':deliverableId')
  @ApiOkResponse({ type: DeliverableResponseDto })
  @ApiNotFoundResponse()
  getDeliverable(@Param('deliverableId') deliverableId: string) {
    return this.deliverablesService.getDeliverable(deliverableId);
  }

  @Patch(':deliverableId')
  @ApiOkResponse({ type: DeliverableResponseDto })
  @ApiNotFoundResponse()
  updateDeliverable(
    @Param('deliverableId') deliverableId: string,
    @Body() dto: UpdateDeliverableDto,
  ) {
    return this.deliverablesService.updateDeliverable(deliverableId, dto);
  }

  @Delete(':deliverableId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  deleteDeliverable(@Param('deliverableId') deliverableId: string) {
    return this.deliverablesService.deleteDeliverable(deliverableId);
  }
}
