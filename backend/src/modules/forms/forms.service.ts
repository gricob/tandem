import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Form, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';

type FormWithFormTypeName = Form & { formType: { name: string } };

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForm(dto: CreateFormDto) {
    const formType = await this.prisma.formType.findUnique({
      where: { id: dto.formTypeId },
    });
    if (!formType) {
      throw new BadRequestException(
        `Form type ${dto.formTypeId} does not exist.`,
      );
    }

    const form = await this.prisma.form.create({
      data: {
        id: ulid(),
        formTypeId: dto.formTypeId,
        name: dto.name,
        description: dto.description,
      },
      include: { formType: { select: { name: true } } },
    });
    return this.toResponse(form);
  }

  async findAllForms(name?: string) {
    const forms = await this.prisma.form.findMany({
      where: name
        ? { name: { contains: name, mode: Prisma.QueryMode.insensitive } }
        : undefined,
      include: { formType: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return forms.map((form) => this.toResponse(form));
  }

  async getForm(formId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: { formType: { select: { name: true } } },
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
      include: { formType: { select: { name: true } } },
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

  private toResponse(form: FormWithFormTypeName) {
    const { formType, ...rest } = form;
    return { ...rest, formTypeName: formType.name };
  }
}
