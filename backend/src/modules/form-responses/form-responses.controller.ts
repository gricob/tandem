import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FormResponseResponseDto } from './dto/form-response-response.dto';
import { SaveFormResponseDto } from './dto/save-form-response.dto';
import { FormResponsesService } from './form-responses.service';

@ApiTags('form-responses')
@Controller('forms/:formId/response')
export class FormResponsesController {
  constructor(private readonly formResponsesService: FormResponsesService) {}

  @Put()
  @ApiOkResponse({ type: FormResponseResponseDto })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  saveResponse(
    @Param('formId') formId: string,
    @Body() dto: SaveFormResponseDto,
  ) {
    return this.formResponsesService.saveResponse(formId, dto.responseData);
  }

  @Get()
  @ApiOkResponse({ type: FormResponseResponseDto })
  @ApiNotFoundResponse()
  getResponse(@Param('formId') formId: string) {
    return this.formResponsesService.getResponse(formId);
  }
}
