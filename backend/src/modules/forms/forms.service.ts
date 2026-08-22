import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Form, FormField, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';

export type FormWithRelations = Form & {
  formTemplate: { name: string } | null;
  fields: FormField[];
};

export const FORM_INCLUDE = {
  formTemplate: { select: { name: true } },
  fields: { orderBy: { orderIndex: 'asc' as const } },
};

type CreateFormFields = Pick<
  CreateFormDto,
  'formTemplateId' | 'description'
> & {
  name?: string;
};

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForm(dto: CreateFormDto) {
    const formId = ulid();
    const operations = await this.buildCreateFormOperations(formId, dto);
    await this.prisma.$transaction(operations);
    return this.getForm(formId);
  }

  // Unexecuted ops, so callers sharing this id (UserStory/AcceptanceCriterion) can compose their own transaction.
  async buildCreateFormOperations(
    formId: string,
    dto: CreateFormFields,
  ): Promise<Prisma.PrismaPromise<unknown>[]> {
    const formTemplate = await this.prisma.formTemplate.findUnique({
      where: { id: dto.formTemplateId },
      include: { templateFields: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!formTemplate) {
      throw new BadRequestException(
        `Form template ${dto.formTemplateId} does not exist.`,
      );
    }

    return [
      this.prisma.form.create({
        data: {
          id: formId,
          formTemplateId: dto.formTemplateId,
          // Falls back to the template's name when the caller has none (AcceptanceCriterion).
          name: dto.name ?? formTemplate.name,
          description: dto.description,
        },
      }),
      ...formTemplate.templateFields.map((field) =>
        this.prisma.formField.create({
          data: {
            id: ulid(),
            formId,
            label: field.label,
            fieldType: field.fieldType,
            isRequired: field.isRequired,
            options: field.options === null ? Prisma.JsonNull : field.options,
            orderIndex: field.orderIndex,
          },
        }),
      ),
    ];
  }

  async findAllForms(name?: string) {
    const forms = await this.prisma.form.findMany({
      where: name
        ? { name: { contains: name, mode: Prisma.QueryMode.insensitive } }
        : undefined,
      include: FORM_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return forms.map((form) => this.toFormResponse(form));
  }

  async getForm(formId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: FORM_INCLUDE,
    });
    if (!form) {
      throw new NotFoundException(`Form ${formId} not found.`);
    }
    return this.toFormResponse(form);
  }

  async updateForm(formId: string, dto: UpdateFormDto) {
    await this.assertFormExists(formId);
    const form = await this.prisma.form.update({
      where: { id: formId },
      data: { name: dto.name, description: dto.description },
      include: FORM_INCLUDE,
    });
    return this.toFormResponse(form);
  }

  // If this form backs a UserStory, its acceptance criteria's own forms are deleted
  // first - deleting a Form only cascades to the UserStory/AcceptanceCriterion row
  // sharing its id, never to an AcceptanceCriterion's own form (see design.md).
  async deleteForm(formId: string): Promise<void> {
    await this.assertFormExists(formId);
    const acceptanceCriteria = await this.prisma.acceptanceCriterion.findMany({
      where: { userStoryId: formId },
      select: { id: true },
    });
    const acceptanceCriteriaIds = acceptanceCriteria.map(
      (acceptanceCriterion) => acceptanceCriterion.id,
    );

    await this.prisma.$transaction([
      ...(acceptanceCriteriaIds.length
        ? [
            this.prisma.form.deleteMany({
              where: { id: { in: acceptanceCriteriaIds } },
            }),
          ]
        : []),
      this.prisma.form.delete({ where: { id: formId } }),
    ]);
  }

  private async assertFormExists(formId: string): Promise<void> {
    const form = await this.prisma.form.findUnique({ where: { id: formId } });
    if (!form) {
      throw new NotFoundException(`Form ${formId} not found.`);
    }
  }

  toFormResponse(form: FormWithRelations) {
    const { formTemplate, ...rest } = form;
    return { ...rest, formTemplateName: formTemplate?.name ?? null };
  }
}
