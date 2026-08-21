import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormFieldType, FormTemplateField, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormTemplateFieldDto } from './dto/create-form-template-field.dto';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateFieldDto } from './dto/update-form-template-field.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';

const FIELDS_ORDER_BY = {
  templateFields: { orderBy: { orderIndex: 'asc' as const } },
};

@Injectable()
export class FormTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  createFormTemplate(dto: CreateFormTemplateDto) {
    return this.prisma.formTemplate.create({
      data: {
        id: ulid(),
        name: dto.name,
        description: dto.description,
      },
      include: FIELDS_ORDER_BY,
    });
  }

  findAllFormTemplates() {
    return this.prisma.formTemplate.findMany({
      include: FIELDS_ORDER_BY,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getFormTemplate(formTemplateId: string) {
    const formTemplate = await this.prisma.formTemplate.findUnique({
      where: { id: formTemplateId },
      include: FIELDS_ORDER_BY,
    });
    if (!formTemplate) {
      throw new NotFoundException(`Form template ${formTemplateId} not found.`);
    }
    return formTemplate;
  }

  async updateFormTemplate(formTemplateId: string, dto: UpdateFormTemplateDto) {
    await this.getFormTemplate(formTemplateId);
    return this.prisma.formTemplate.update({
      where: { id: formTemplateId },
      data: { name: dto.name, description: dto.description },
      include: FIELDS_ORDER_BY,
    });
  }

  async deleteFormTemplate(formTemplateId: string): Promise<void> {
    await this.getFormTemplate(formTemplateId);
    await this.prisma.formTemplate.delete({ where: { id: formTemplateId } });
  }

  async addField(formTemplateId: string, dto: CreateFormTemplateFieldDto) {
    await this.getFormTemplate(formTemplateId);
    this.validateOptions(dto.fieldType, dto.options);

    const lastField = await this.prisma.formTemplateField.findFirst({
      where: { formTemplateId },
      orderBy: { orderIndex: 'desc' },
    });

    return this.prisma.formTemplateField.create({
      data: {
        id: ulid(),
        formTemplateId,
        label: dto.label,
        fieldType: dto.fieldType,
        isRequired: dto.isRequired ?? false,
        options: dto.options,
        orderIndex: lastField ? lastField.orderIndex + 1 : 0,
      },
    });
  }

  async updateField(
    formTemplateId: string,
    fieldId: string,
    dto: UpdateFormTemplateFieldDto,
  ) {
    const field = await this.getFieldOrThrow(formTemplateId, fieldId);

    const nextFieldType = dto.fieldType ?? field.fieldType;
    const nextOptions =
      dto.options !== undefined
        ? dto.options
        : (field.options as string[] | null);
    this.validateOptions(nextFieldType, nextOptions);

    return this.prisma.formTemplateField.update({
      where: { id: fieldId },
      data: {
        label: dto.label,
        fieldType: dto.fieldType,
        isRequired: dto.isRequired,
        options:
          dto.options !== undefined
            ? (dto.options ?? Prisma.JsonNull)
            : undefined,
      },
    });
  }

  async removeField(formTemplateId: string, fieldId: string): Promise<void> {
    await this.getFieldOrThrow(formTemplateId, fieldId);
    await this.prisma.formTemplateField.delete({ where: { id: fieldId } });
  }

  async reorderFields(formTemplateId: string, fieldIds: string[]) {
    await this.getFormTemplate(formTemplateId);

    const existingFields = await this.prisma.formTemplateField.findMany({
      where: { formTemplateId },
      select: { id: true },
    });
    const existingIds = new Set(existingFields.map((field) => field.id));
    const submittedIds = new Set(fieldIds);

    const matchesExactly =
      existingIds.size === submittedIds.size &&
      [...existingIds].every((id) => submittedIds.has(id));
    if (!matchesExactly) {
      throw new BadRequestException(
        "The submitted field ids must exactly match the form template's current fields.",
      );
    }

    await this.prisma.$transaction(
      fieldIds.map((id, index) =>
        this.prisma.formTemplateField.update({
          where: { id },
          data: { orderIndex: index },
        }),
      ),
    );

    return this.getFormTemplate(formTemplateId);
  }

  private async getFieldOrThrow(
    formTemplateId: string,
    fieldId: string,
  ): Promise<FormTemplateField> {
    const field = await this.prisma.formTemplateField.findUnique({
      where: { id: fieldId },
    });
    if (!field || field.formTemplateId !== formTemplateId) {
      throw new NotFoundException(
        `Field ${fieldId} not found on form template ${formTemplateId}.`,
      );
    }
    return field;
  }

  private validateOptions(
    fieldType: FormFieldType,
    options: string[] | null | undefined,
  ): void {
    const requiresOptions =
      fieldType === FormFieldType.select ||
      fieldType === FormFieldType.multi_select;

    if (requiresOptions && (!options || options.length === 0)) {
      throw new BadRequestException(
        'Options must be a non-empty array for select/multi_select fields.',
      );
    }
    if (!requiresOptions && options != null) {
      throw new BadRequestException(
        'Options must not be set for non-select field types.',
      );
    }
  }
}
