import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FormFieldType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FormTemplatesService } from './form-templates.service';

type MockPrismaService = {
  formTemplate: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  formTemplateField: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
};

function createMockPrisma(): MockPrismaService {
  return {
    formTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    formTemplateField: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('FormTemplatesService', () => {
  let service: FormTemplatesService;
  let prisma: MockPrismaService;

  const formTemplate = {
    id: 'form-template-1',
    name: 'Bug report',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormTemplatesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FormTemplatesService>(FormTemplatesService);
  });

  describe('getFormTemplate', () => {
    it('throws NotFoundException when the form template does not exist', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(null);

      await expect(service.getFormTemplate('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the form template with its fields when found', async () => {
      const withFields = { ...formTemplate, templateFields: [] };
      prisma.formTemplate.findUnique.mockResolvedValue(withFields);

      await expect(service.getFormTemplate(formTemplate.id)).resolves.toEqual(
        withFields,
      );
    });
  });

  describe('deleteFormTemplate', () => {
    it('deletes an existing form template', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue({
        ...formTemplate,
        templateFields: [],
      });
      prisma.formTemplate.delete.mockResolvedValue(formTemplate);

      await service.deleteFormTemplate(formTemplate.id);

      expect(prisma.formTemplate.delete).toHaveBeenCalledWith({
        where: { id: formTemplate.id },
      });
    });

    it('throws NotFoundException instead of deleting a missing form template', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(null);

      await expect(service.deleteFormTemplate('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.formTemplate.delete).not.toHaveBeenCalled();
    });
  });

  describe('addField', () => {
    beforeEach(() => {
      prisma.formTemplate.findUnique.mockResolvedValue({
        ...formTemplate,
        templateFields: [],
      });
    });

    it('appends a field after the last existing order_index', async () => {
      prisma.formTemplateField.findFirst.mockResolvedValue({ orderIndex: 2 });
      prisma.formTemplateField.create.mockResolvedValue({});

      await service.addField(formTemplate.id, {
        label: 'Notes',
        fieldType: FormFieldType.text,
      });

      const [{ data }] = prisma.formTemplateField.create.mock.calls[0] as [
        { data: { orderIndex: number } },
      ];
      expect(data.orderIndex).toBe(3);
    });

    it('starts at order_index 0 for the first field', async () => {
      prisma.formTemplateField.findFirst.mockResolvedValue(null);
      prisma.formTemplateField.create.mockResolvedValue({});

      await service.addField(formTemplate.id, {
        label: 'Notes',
        fieldType: FormFieldType.text,
      });

      const [{ data }] = prisma.formTemplateField.create.mock.calls[0] as [
        { data: { orderIndex: number } },
      ];
      expect(data.orderIndex).toBe(0);
    });

    it('rejects a select field with no options', async () => {
      await expect(
        service.addField(formTemplate.id, {
          label: 'Severity',
          fieldType: FormFieldType.select,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.formTemplateField.create).not.toHaveBeenCalled();
    });

    it('rejects a select field with an empty options array', async () => {
      await expect(
        service.addField(formTemplate.id, {
          label: 'Severity',
          fieldType: FormFieldType.multi_select,
          options: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a non-select field that has options', async () => {
      await expect(
        service.addField(formTemplate.id, {
          label: 'Notes',
          fieldType: FormFieldType.text,
          options: ['a'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts a select field with non-empty options', async () => {
      prisma.formTemplateField.findFirst.mockResolvedValue(null);
      prisma.formTemplateField.create.mockResolvedValue({});

      await expect(
        service.addField(formTemplate.id, {
          label: 'Severity',
          fieldType: FormFieldType.select,
          options: ['low', 'high'],
        }),
      ).resolves.toBeDefined();
    });

    it('accepts a valid condition referencing an existing field', async () => {
      prisma.formTemplateField.findMany.mockResolvedValue([
        {
          id: 'trigger',
          fieldType: FormFieldType.boolean,
          options: null,
          condition: null,
        },
      ]);
      prisma.formTemplateField.findFirst.mockResolvedValue(null);
      prisma.formTemplateField.create.mockResolvedValue({});

      await expect(
        service.addField(formTemplate.id, {
          label: 'Notes',
          fieldType: FormFieldType.text,
          condition: { field: 'trigger', operator: 'equals', value: true },
        }),
      ).resolves.toBeDefined();
    });

    it('rejects a condition referencing a field outside the form template', async () => {
      prisma.formTemplateField.findMany.mockResolvedValue([]);

      await expect(
        service.addField(formTemplate.id, {
          label: 'Notes',
          fieldType: FormFieldType.text,
          condition: { field: 'unknown', operator: 'equals', value: true },
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.formTemplateField.create).not.toHaveBeenCalled();
    });

    it('rejects a condition operator invalid for the referenced field type', async () => {
      prisma.formTemplateField.findMany.mockResolvedValue([
        {
          id: 'trigger',
          fieldType: FormFieldType.text,
          options: null,
          condition: null,
        },
      ]);

      await expect(
        service.addField(formTemplate.id, {
          label: 'Notes',
          fieldType: FormFieldType.text,
          condition: { field: 'trigger', operator: 'gt', value: 5 },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateField', () => {
    const existingField = {
      id: 'field-1',
      formTemplateId: formTemplate.id,
      label: 'Severity',
      fieldType: FormFieldType.select,
      isRequired: true,
      options: ['low', 'high'],
      orderIndex: 0,
    };

    it('throws NotFoundException when the field does not belong to the form template', async () => {
      prisma.formTemplateField.findUnique.mockResolvedValue({
        ...existingField,
        formTemplateId: 'other-form-template',
      });

      await expect(
        service.updateField(formTemplate.id, existingField.id, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('validates options against the resulting field type when only fieldType changes', async () => {
      prisma.formTemplateField.findUnique.mockResolvedValue({
        ...existingField,
        options: null,
        fieldType: FormFieldType.text,
      });

      await expect(
        service.updateField(formTemplate.id, existingField.id, {
          fieldType: FormFieldType.select,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows clearing options when switching to a non-select field type', async () => {
      prisma.formTemplateField.findUnique.mockResolvedValue(existingField);
      prisma.formTemplateField.update.mockResolvedValue({});

      await expect(
        service.updateField(formTemplate.id, existingField.id, {
          fieldType: FormFieldType.text,
          options: null,
        }),
      ).resolves.toBeDefined();
    });

    it('clears a condition when set to null, without re-validating it', async () => {
      prisma.formTemplateField.findUnique.mockResolvedValue(existingField);
      prisma.formTemplateField.update.mockResolvedValue({});

      await expect(
        service.updateField(formTemplate.id, existingField.id, {
          condition: null,
        }),
      ).resolves.toBeDefined();
      expect(prisma.formTemplateField.findMany).not.toHaveBeenCalled();
    });

    it('rejects a condition that would create a circular dependency', async () => {
      prisma.formTemplateField.findUnique.mockResolvedValue(existingField);
      prisma.formTemplateField.findMany.mockResolvedValue([
        { ...existingField, condition: null },
        {
          id: 'field-2',
          fieldType: FormFieldType.boolean,
          options: null,
          condition: {
            field: existingField.id,
            operator: 'equals',
            value: true,
          },
        },
      ]);

      await expect(
        service.updateField(formTemplate.id, existingField.id, {
          condition: { field: 'field-2', operator: 'equals', value: true },
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.formTemplateField.update).not.toHaveBeenCalled();
    });
  });

  describe('removeField', () => {
    it('deletes a field that no other field depends on', async () => {
      prisma.formTemplateField.findUnique.mockResolvedValue({
        id: 'field-1',
        formTemplateId: formTemplate.id,
      });
      prisma.formTemplateField.findMany.mockResolvedValue([
        { id: 'field-2', condition: null },
      ]);
      prisma.formTemplateField.delete.mockResolvedValue({});

      await service.removeField(formTemplate.id, 'field-1');

      expect(prisma.formTemplateField.delete).toHaveBeenCalledWith({
        where: { id: 'field-1' },
      });
    });

    it('rejects removing a field that another field depends on', async () => {
      prisma.formTemplateField.findUnique.mockResolvedValue({
        id: 'field-1',
        formTemplateId: formTemplate.id,
      });
      prisma.formTemplateField.findMany.mockResolvedValue([
        {
          id: 'field-2',
          condition: { field: 'field-1', operator: 'is_not_empty' },
        },
      ]);

      await expect(
        service.removeField(formTemplate.id, 'field-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.formTemplateField.delete).not.toHaveBeenCalled();
    });
  });

  describe('reorderFields', () => {
    beforeEach(() => {
      prisma.formTemplate.findUnique.mockResolvedValue({
        ...formTemplate,
        templateFields: [],
      });
    });

    it('rejects a payload missing one of the current field ids', async () => {
      prisma.formTemplateField.findMany.mockResolvedValue([
        { id: 'field-1' },
        { id: 'field-2' },
      ]);

      await expect(
        service.reorderFields(formTemplate.id, ['field-1']),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a payload with an id that does not belong to the form template', async () => {
      prisma.formTemplateField.findMany.mockResolvedValue([{ id: 'field-1' }]);

      await expect(
        service.reorderFields(formTemplate.id, ['field-1', 'field-unknown']),
      ).rejects.toThrow(BadRequestException);
    });

    it('rewrites order_index for a matching, reordered id list', async () => {
      prisma.formTemplateField.findMany.mockResolvedValue([
        { id: 'field-1' },
        { id: 'field-2' },
      ]);
      prisma.$transaction.mockResolvedValue([]);

      await service.reorderFields(formTemplate.id, ['field-2', 'field-1']);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.formTemplateField.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'field-2' },
        data: { orderIndex: 0 },
      });
      expect(prisma.formTemplateField.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'field-1' },
        data: { orderIndex: 1 },
      });
    });
  });
});
