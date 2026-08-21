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

type FormWithRelations = Form & {
  formTemplate: { name: string } | null;
  fields: FormField[];
};

const FORM_INCLUDE = {
  formTemplate: { select: { name: true } },
  fields: { orderBy: { orderIndex: 'asc' as const } },
};

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForm(dto: CreateFormDto) {
    const formTemplate = await this.prisma.formTemplate.findUnique({
      where: { id: dto.formTemplateId },
      include: { templateFields: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!formTemplate) {
      throw new BadRequestException(
        `Form template ${dto.formTemplateId} does not exist.`,
      );
    }

    const formId = ulid();
    await this.prisma.$transaction([
      this.prisma.form.create({
        data: {
          id: formId,
          formTemplateId: dto.formTemplateId,
          name: dto.name,
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
    ]);

    return this.getForm(formId);
  }

  async findAllForms(name?: string) {
    const forms = await this.prisma.form.findMany({
      where: name
        ? { name: { contains: name, mode: Prisma.QueryMode.insensitive } }
        : undefined,
      include: FORM_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return forms.map((form) => this.toResponse(form));
  }

  async getForm(formId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: FORM_INCLUDE,
    });
    if (!form) {
      throw new NotFoundException(`Form ${formId} not found.`);
    }
    return this.toResponse(form);
  }

  async updateForm(formId: string, dto: UpdateFormDto) {
    await this.assertFormExists(formId);
    const form = await this.prisma.form.update({
      where: { id: formId },
      data: { name: dto.name, description: dto.description },
      include: FORM_INCLUDE,
    });
    return this.toResponse(form);
  }

  async deleteForm(formId: string): Promise<void> {
    await this.assertFormExists(formId);
    await this.prisma.form.delete({ where: { id: formId } });
  }

  private async assertFormExists(formId: string): Promise<void> {
    const form = await this.prisma.form.findUnique({ where: { id: formId } });
    if (!form) {
      throw new NotFoundException(`Form ${formId} not found.`);
    }
  }

  private toResponse(form: FormWithRelations) {
    const { formTemplate, ...rest } = form;
    return { ...rest, formTemplateName: formTemplate?.name ?? null };
  }
}
