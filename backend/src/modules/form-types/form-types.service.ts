import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormField, FormFieldType, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { CreateFormTypeDto } from './dto/create-form-type.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { UpdateFormTypeDto } from './dto/update-form-type.dto';

const FIELDS_ORDER_BY = { fields: { orderBy: { orderIndex: 'asc' as const } } };

@Injectable()
export class FormTypesService {
  constructor(private readonly prisma: PrismaService) {}

  createFormType(dto: CreateFormTypeDto) {
    return this.prisma.formType.create({
      data: {
        id: ulid(),
        name: dto.name,
        description: dto.description,
      },
      include: FIELDS_ORDER_BY,
    });
  }

  findAllFormTypes() {
    return this.prisma.formType.findMany({
      include: FIELDS_ORDER_BY,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getFormType(formTypeId: string) {
    const formType = await this.prisma.formType.findUnique({
      where: { id: formTypeId },
      include: FIELDS_ORDER_BY,
    });
    if (!formType) {
      throw new NotFoundException(`Form type ${formTypeId} not found.`);
    }
    return formType;
  }

  async updateFormType(formTypeId: string, dto: UpdateFormTypeDto) {
    await this.getFormType(formTypeId);
    return this.prisma.formType.update({
      where: { id: formTypeId },
      data: { name: dto.name, description: dto.description },
      include: FIELDS_ORDER_BY,
    });
  }

  async deleteFormType(formTypeId: string): Promise<void> {
    await this.getFormType(formTypeId);
    await this.prisma.formType.delete({ where: { id: formTypeId } });
  }

  async addField(formTypeId: string, dto: CreateFormFieldDto) {
    await this.getFormType(formTypeId);
    this.validateOptions(dto.fieldType, dto.options);

    const lastField = await this.prisma.formField.findFirst({
      where: { formTypeId },
      orderBy: { orderIndex: 'desc' },
    });

    return this.prisma.formField.create({
      data: {
        id: ulid(),
        formTypeId,
        label: dto.label,
        fieldType: dto.fieldType,
        isRequired: dto.isRequired ?? false,
        options: dto.options,
        orderIndex: lastField ? lastField.orderIndex + 1 : 0,
      },
    });
  }

  async updateField(
    formTypeId: string,
    fieldId: string,
    dto: UpdateFormFieldDto,
  ) {
    const field = await this.getFieldOrThrow(formTypeId, fieldId);

    const nextFieldType = dto.fieldType ?? field.fieldType;
    const nextOptions =
      dto.options !== undefined
        ? dto.options
        : (field.options as string[] | null);
    this.validateOptions(nextFieldType, nextOptions);

    return this.prisma.formField.update({
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

  async removeField(formTypeId: string, fieldId: string): Promise<void> {
    await this.getFieldOrThrow(formTypeId, fieldId);
    await this.prisma.formField.delete({ where: { id: fieldId } });
  }

  async reorderFields(formTypeId: string, fieldIds: string[]) {
    await this.getFormType(formTypeId);

    const existingFields = await this.prisma.formField.findMany({
      where: { formTypeId },
      select: { id: true },
    });
    const existingIds = new Set(existingFields.map((field) => field.id));
    const submittedIds = new Set(fieldIds);

    const matchesExactly =
      existingIds.size === submittedIds.size &&
      [...existingIds].every((id) => submittedIds.has(id));
    if (!matchesExactly) {
      throw new BadRequestException(
        "The submitted field ids must exactly match the form type's current fields.",
      );
    }

    await this.prisma.$transaction(
      fieldIds.map((id, index) =>
        this.prisma.formField.update({
          where: { id },
          data: { orderIndex: index },
        }),
      ),
    );

    return this.getFormType(formTypeId);
  }

  private async getFieldOrThrow(
    formTypeId: string,
    fieldId: string,
  ): Promise<FormField> {
    const field = await this.prisma.formField.findUnique({
      where: { id: fieldId },
    });
    if (!field || field.formTypeId !== formTypeId) {
      throw new NotFoundException(
        `Field ${fieldId} not found on form type ${formTypeId}.`,
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
