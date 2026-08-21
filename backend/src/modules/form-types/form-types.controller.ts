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
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { CreateFormTypeDto } from './dto/create-form-type.dto';
import { FormFieldResponseDto } from './dto/form-field-response.dto';
import { FormTypeResponseDto } from './dto/form-type-response.dto';
import { ReorderFieldsDto } from './dto/reorder-fields.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { UpdateFormTypeDto } from './dto/update-form-type.dto';
import { FormTypesService } from './form-types.service';

@ApiTags('form-types')
@Controller('form-types')
export class FormTypesController {
  constructor(private readonly formTypesService: FormTypesService) {}

  @Post()
  @ApiCreatedResponse({ type: FormTypeResponseDto })
  createFormType(@Body() dto: CreateFormTypeDto) {
    return this.formTypesService.createFormType(dto);
  }

  @Get()
  @ApiOkResponse({ type: [FormTypeResponseDto] })
  findAllFormTypes() {
    return this.formTypesService.findAllFormTypes();
  }

  @Get(':formTypeId')
  @ApiOkResponse({ type: FormTypeResponseDto })
  @ApiNotFoundResponse()
  getFormType(@Param('formTypeId') formTypeId: string) {
    return this.formTypesService.getFormType(formTypeId);
  }

  @Patch(':formTypeId')
  @ApiOkResponse({ type: FormTypeResponseDto })
  @ApiNotFoundResponse()
  updateFormType(
    @Param('formTypeId') formTypeId: string,
    @Body() dto: UpdateFormTypeDto,
  ) {
    return this.formTypesService.updateFormType(formTypeId, dto);
  }

  @Delete(':formTypeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  deleteFormType(@Param('formTypeId') formTypeId: string) {
    return this.formTypesService.deleteFormType(formTypeId);
  }

  @Post(':formTypeId/fields')
  @ApiCreatedResponse({ type: FormFieldResponseDto })
  @ApiNotFoundResponse()
  addField(
    @Param('formTypeId') formTypeId: string,
    @Body() dto: CreateFormFieldDto,
  ) {
    return this.formTypesService.addField(formTypeId, dto);
  }

  @Put(':formTypeId/fields/order')
  @ApiOkResponse({ type: FormTypeResponseDto })
  @ApiNotFoundResponse()
  reorderFields(
    @Param('formTypeId') formTypeId: string,
    @Body() dto: ReorderFieldsDto,
  ) {
    return this.formTypesService.reorderFields(formTypeId, dto.fieldIds);
  }

  @Patch(':formTypeId/fields/:fieldId')
  @ApiOkResponse({ type: FormFieldResponseDto })
  @ApiNotFoundResponse()
  updateField(
    @Param('formTypeId') formTypeId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateFormFieldDto,
  ) {
    return this.formTypesService.updateField(formTypeId, fieldId, dto);
  }

  @Delete(':formTypeId/fields/:fieldId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  removeField(
    @Param('formTypeId') formTypeId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.formTypesService.removeField(formTypeId, fieldId);
  }
}
