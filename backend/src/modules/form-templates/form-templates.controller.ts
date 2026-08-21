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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFormTemplateFieldDto } from './dto/create-form-template-field.dto';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { FormTemplateFieldResponseDto } from './dto/form-template-field-response.dto';
import { FormTemplateResponseDto } from './dto/form-template-response.dto';
import { ReorderFieldsDto } from './dto/reorder-fields.dto';
import { UpdateFormTemplateFieldDto } from './dto/update-form-template-field.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { FormTemplatesService } from './form-templates.service';

@ApiTags('form-templates')
@Controller('form-templates')
export class FormTemplatesController {
  constructor(private readonly formTemplatesService: FormTemplatesService) {}

  @Post()
  @ApiCreatedResponse({ type: FormTemplateResponseDto })
  createFormTemplate(@Body() dto: CreateFormTemplateDto) {
    return this.formTemplatesService.createFormTemplate(dto);
  }

  @Get()
  @ApiOkResponse({ type: [FormTemplateResponseDto] })
  findAllFormTemplates() {
    return this.formTemplatesService.findAllFormTemplates();
  }

  @Get(':formTemplateId')
  @ApiOkResponse({ type: FormTemplateResponseDto })
  @ApiNotFoundResponse()
  getFormTemplate(@Param('formTemplateId') formTemplateId: string) {
    return this.formTemplatesService.getFormTemplate(formTemplateId);
  }

  @Patch(':formTemplateId')
  @ApiOkResponse({ type: FormTemplateResponseDto })
  @ApiNotFoundResponse()
  updateFormTemplate(
    @Param('formTemplateId') formTemplateId: string,
    @Body() dto: UpdateFormTemplateDto,
  ) {
    return this.formTemplatesService.updateFormTemplate(formTemplateId, dto);
  }

  @Delete(':formTemplateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  deleteFormTemplate(@Param('formTemplateId') formTemplateId: string) {
    return this.formTemplatesService.deleteFormTemplate(formTemplateId);
  }

  @Post(':formTemplateId/fields')
  @ApiCreatedResponse({ type: FormTemplateFieldResponseDto })
  @ApiNotFoundResponse()
  addField(
    @Param('formTemplateId') formTemplateId: string,
    @Body() dto: CreateFormTemplateFieldDto,
  ) {
    return this.formTemplatesService.addField(formTemplateId, dto);
  }

  @Put(':formTemplateId/fields/order')
  @ApiOkResponse({ type: FormTemplateResponseDto })
  @ApiNotFoundResponse()
  reorderFields(
    @Param('formTemplateId') formTemplateId: string,
    @Body() dto: ReorderFieldsDto,
  ) {
    return this.formTemplatesService.reorderFields(
      formTemplateId,
      dto.fieldIds,
    );
  }

  @Patch(':formTemplateId/fields/:fieldId')
  @ApiOkResponse({ type: FormTemplateFieldResponseDto })
  @ApiNotFoundResponse()
  updateField(
    @Param('formTemplateId') formTemplateId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateFormTemplateFieldDto,
  ) {
    return this.formTemplatesService.updateField(formTemplateId, fieldId, dto);
  }

  @Delete(':formTemplateId/fields/:fieldId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  removeField(
    @Param('formTemplateId') formTemplateId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.formTemplatesService.removeField(formTemplateId, fieldId);
  }
}
