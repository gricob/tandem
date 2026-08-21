import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { FormsService } from './forms.service';

type MockPrismaService = {
  formTemplate: {
    findUnique: jest.Mock;
  };
  form: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  formField: {
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

function createMockPrisma(): MockPrismaService {
  return {
    formTemplate: {
      findUnique: jest.fn(),
    },
    form: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    formField: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('FormsService', () => {
  let service: FormsService;
  let prisma: MockPrismaService;

  const formTemplate = {
    id: 'form-template-1',
    name: 'Bug report',
    templateFields: [
      {
        id: 'template-field-1',
        label: 'Severity',
        fieldType: 'text',
        isRequired: true,
        options: null,
        orderIndex: 0,
      },
    ],
  };
  const form = {
    id: 'form-1',
    formTemplateId: formTemplate.id,
    name: 'Bug report #1',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    formTemplate: { name: formTemplate.name },
    fields: [],
  };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FormsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });

  describe('createForm', () => {
    it('rejects a form_template_id that does not exist', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.createForm({ formTemplateId: 'missing', name: 'A form' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.form.create).not.toHaveBeenCalled();
    });

    it('creates a form, clones the template fields, and flattens the template name into the response', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(formTemplate);
      prisma.$transaction.mockResolvedValue([]);
      prisma.form.findUnique.mockResolvedValue(form);

      await expect(
        service.createForm({
          formTemplateId: formTemplate.id,
          name: form.name,
        }),
      ).resolves.toEqual({
        id: form.id,
        formTemplateId: form.formTemplateId,
        formTemplateName: formTemplate.name,
        name: form.name,
        description: form.description,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        fields: form.fields,
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const [operations] = prisma.$transaction.mock.calls[0] as [unknown[]];
      expect(operations).toHaveLength(1 + formTemplate.templateFields.length);
    });
  });

  describe('findAllForms', () => {
    it('lists forms without a filter', async () => {
      prisma.form.findMany.mockResolvedValue([form]);

      const result = await service.findAllForms();

      expect(prisma.form.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
      expect(result).toEqual([
        expect.objectContaining({ formTemplateName: formTemplate.name }),
      ]);
    });

    it('filters forms by a case-insensitive name substring', async () => {
      prisma.form.findMany.mockResolvedValue([form]);

      await service.findAllForms('bug');

      expect(prisma.form.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'bug', mode: 'insensitive' } },
        }),
      );
    });

    it('reports a null template name for a form whose template was deleted', async () => {
      prisma.form.findMany.mockResolvedValue([
        { ...form, formTemplateId: null, formTemplate: null },
      ]);

      const result = await service.findAllForms();

      expect(result).toEqual([
        expect.objectContaining({
          formTemplateId: null,
          formTemplateName: null,
        }),
      ]);
    });
  });

  describe('getForm', () => {
    it('throws NotFoundException when the form does not exist', async () => {
      prisma.form.findUnique.mockResolvedValue(null);

      await expect(service.getForm('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the form with its template name when found', async () => {
      prisma.form.findUnique.mockResolvedValue(form);

      await expect(service.getForm(form.id)).resolves.toMatchObject({
        id: form.id,
        formTemplateName: formTemplate.name,
      });
    });
  });

  describe('updateForm', () => {
    it('throws NotFoundException instead of updating a missing form', async () => {
      prisma.form.findUnique.mockResolvedValue(null);

      await expect(
        service.updateForm('missing', { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.form.update).not.toHaveBeenCalled();
    });

    it('updates an existing form', async () => {
      prisma.form.findUnique.mockResolvedValue(form);
      prisma.form.update.mockResolvedValue({ ...form, name: 'New name' });

      await expect(
        service.updateForm(form.id, { name: 'New name' }),
      ).resolves.toMatchObject({ name: 'New name' });
    });
  });

  describe('deleteForm', () => {
    it('deletes an existing form', async () => {
      prisma.form.findUnique.mockResolvedValue(form);
      prisma.form.delete.mockResolvedValue(form);

      await service.deleteForm(form.id);

      expect(prisma.form.delete).toHaveBeenCalledWith({
        where: { id: form.id },
      });
    });

    it('throws NotFoundException instead of deleting a missing form', async () => {
      prisma.form.findUnique.mockResolvedValue(null);

      await expect(service.deleteForm('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.form.delete).not.toHaveBeenCalled();
    });
  });
});
