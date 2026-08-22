import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Form, FormField, FormFieldType, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import { resolveVisibility } from '../../condition/condition-evaluator';
import { ConditionNode } from '../../condition/condition.types';
import { PrismaService } from '../../prisma/prisma.service';

type FormWithFields = Form & { fields: FormField[] };

type StoredResponse = {
  id: string;
  formId: string;
  responseData: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class FormResponsesService {
  constructor(private readonly prisma: PrismaService) {}

  async saveResponse(formId: string, submitted: Record<string, unknown>) {
    const form = await this.getFormWithFields(formId);
    const fieldsById = new Map(form.fields.map((f) => [f.id, f]));

    for (const [fieldId, value] of Object.entries(submitted)) {
      const field = fieldsById.get(fieldId);
      if (!field) {
        throw new BadRequestException(
          `Field ${fieldId} does not belong to this form.`,
        );
      }
      if (value !== null) {
        this.validateValue(field, value);
      }
    }

    const existing = await this.prisma.formResponse.findUnique({
      where: { formId },
    });
    const existingData = (existing?.responseData ?? {}) as Record<
      string,
      unknown
    >;
    const merged = { ...existingData };
    for (const [fieldId, value] of Object.entries(submitted)) {
      if (value === null) {
        delete merged[fieldId];
      } else {
        merged[fieldId] = value;
      }
    }
    const responseData = merged as Prisma.InputJsonValue;

    const saved = existing
      ? await this.prisma.formResponse.update({
          where: { formId },
          data: { responseData },
        })
      : await this.prisma.formResponse.create({
          data: { id: ulid(), formId, responseData },
        });

    return this.toResponse(saved, form.fields);
  }

  async getResponse(formId: string) {
    const form = await this.getFormWithFields(formId);
    const response = await this.prisma.formResponse.findUnique({
      where: { formId },
    });
    if (!response) {
      throw new NotFoundException(`Form ${formId} has no saved response.`);
    }
    return this.toResponse(response, form.fields);
  }

  private async getFormWithFields(formId: string): Promise<FormWithFields> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: { fields: true },
    });
    if (!form) {
      throw new NotFoundException(`Form ${formId} not found.`);
    }
    return form;
  }

  private validateValue(field: FormField, value: unknown): void {
    const options = (field.options as string[] | null) ?? [];
    switch (field.fieldType) {
      case FormFieldType.text:
      case FormFieldType.textarea:
        if (typeof value !== 'string') {
          throw new BadRequestException(`Field ${field.id} must be a string.`);
        }
        return;
      case FormFieldType.number:
        if (typeof value !== 'number' || Number.isNaN(value)) {
          throw new BadRequestException(`Field ${field.id} must be a number.`);
        }
        return;
      case FormFieldType.boolean:
        if (typeof value !== 'boolean') {
          throw new BadRequestException(`Field ${field.id} must be a boolean.`);
        }
        return;
      case FormFieldType.select:
        if (typeof value !== 'string' || !options.includes(value)) {
          throw new BadRequestException(
            `Field ${field.id} must be one of its options.`,
          );
        }
        return;
      case FormFieldType.multi_select:
        if (
          !Array.isArray(value) ||
          !value.every((v) => typeof v === 'string' && options.includes(v))
        ) {
          throw new BadRequestException(
            `Field ${field.id} must be an array of its options.`,
          );
        }
        return;
      case FormFieldType.date:
        if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
          throw new BadRequestException(
            `Field ${field.id} must be an ISO date string.`,
          );
        }
        return;
    }
  }

  private toResponse(response: StoredResponse, fields: FormField[]) {
    const responseData = response.responseData as Record<string, unknown>;
    const visibility = resolveVisibility(
      fields.map((field) => ({
        id: field.id,
        condition: field.condition as ConditionNode | null,
      })),
      responseData,
    );
    const isComplete = fields
      .filter((field) => field.isRequired && visibility.get(field.id))
      .every((field) => responseData[field.id] != null);
    return { ...response, isComplete };
  }
}
