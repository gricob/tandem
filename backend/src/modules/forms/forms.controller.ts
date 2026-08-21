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
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFormDto } from './dto/create-form.dto';
import { FormResponseDto } from './dto/form-response.dto';
import { ListFormsQueryDto } from './dto/list-forms-query.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { FormsService } from './forms.service';

@ApiTags('forms')
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @ApiCreatedResponse({ type: FormResponseDto })
  @ApiBadRequestResponse()
  createForm(@Body() dto: CreateFormDto) {
    return this.formsService.createForm(dto);
  }

  @Get()
  @ApiOkResponse({ type: [FormResponseDto] })
  findAllForms(@Query() query: ListFormsQueryDto) {
    return this.formsService.findAllForms(query.name);
  }

  @Get(':formId')
  @ApiOkResponse({ type: FormResponseDto })
  @ApiNotFoundResponse()
  getForm(@Param('formId') formId: string) {
    return this.formsService.getForm(formId);
  }

  @Patch(':formId')
  @ApiOkResponse({ type: FormResponseDto })
  @ApiNotFoundResponse()
  updateForm(@Param('formId') formId: string, @Body() dto: UpdateFormDto) {
    return this.formsService.updateForm(formId, dto);
  }

  @Delete(':formId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  deleteForm(@Param('formId') formId: string) {
    return this.formsService.deleteForm(formId);
  }
}
