import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FormFieldType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FormTypesService } from './form-types.service';

type MockPrismaService = {
  formType: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  formField: {
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
    formType: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    formField: {
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

describe('FormTypesService', () => {
  let service: FormTypesService;
  let prisma: MockPrismaService;

  const formType = {
    id: 'form-type-1',
    name: 'Bug report',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormTypesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FormTypesService>(FormTypesService);
  });

  describe('getFormType', () => {
    it('throws NotFoundException when the form type does not exist', async () => {
      prisma.formType.findUnique.mockResolvedValue(null);

      await expect(service.getFormType('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the form type with its fields when found', async () => {
      const withFields = { ...formType, fields: [] };
      prisma.formType.findUnique.mockResolvedValue(withFields);

      await expect(service.getFormType(formType.id)).resolves.toEqual(
        withFields,
      );
    });
  });

  describe('deleteFormType', () => {
    it('deletes an existing form type', async () => {
      prisma.formType.findUnique.mockResolvedValue({ ...formType, fields: [] });
      prisma.formType.delete.mockResolvedValue(formType);

      await service.deleteFormType(formType.id);

      expect(prisma.formType.delete).toHaveBeenCalledWith({
        where: { id: formType.id },
      });
    });

    it('throws NotFoundException instead of deleting a missing form type', async () => {
      prisma.formType.findUnique.mockResolvedValue(null);

      await expect(service.deleteFormType('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.formType.delete).not.toHaveBeenCalled();
    });
  });

  describe('addField', () => {
    beforeEach(() => {
      prisma.formType.findUnique.mockResolvedValue({ ...formType, fields: [] });
    });

    it('appends a field after the last existing order_index', async () => {
      prisma.formField.findFirst.mockResolvedValue({ orderIndex: 2 });
      prisma.formField.create.mockResolvedValue({});

      await service.addField(formType.id, {
        label: 'Notes',
        fieldType: FormFieldType.text,
      });

      const [{ data }] = prisma.formField.create.mock.calls[0] as [
        { data: { orderIndex: number } },
      ];
      expect(data.orderIndex).toBe(3);
    });

    it('starts at order_index 0 for the first field', async () => {
      prisma.formField.findFirst.mockResolvedValue(null);
      prisma.formField.create.mockResolvedValue({});

      await service.addField(formType.id, {
        label: 'Notes',
        fieldType: FormFieldType.text,
      });

      const [{ data }] = prisma.formField.create.mock.calls[0] as [
        { data: { orderIndex: number } },
      ];
      expect(data.orderIndex).toBe(0);
    });

    it('rejects a select field with no options', async () => {
      await expect(
        service.addField(formType.id, {
          label: 'Severity',
          fieldType: FormFieldType.select,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.formField.create).not.toHaveBeenCalled();
    });

    it('rejects a select field with an empty options array', async () => {
      await expect(
        service.addField(formType.id, {
          label: 'Severity',
          fieldType: FormFieldType.multi_select,
          options: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a non-select field that has options', async () => {
      await expect(
        service.addField(formType.id, {
          label: 'Notes',
          fieldType: FormFieldType.text,
          options: ['a'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts a select field with non-empty options', async () => {
      prisma.formField.findFirst.mockResolvedValue(null);
      prisma.formField.create.mockResolvedValue({});

      await expect(
        service.addField(formType.id, {
          label: 'Severity',
          fieldType: FormFieldType.select,
          options: ['low', 'high'],
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('updateField', () => {
    const existingField = {
      id: 'field-1',
      formTypeId: formType.id,
      label: 'Severity',
      fieldType: FormFieldType.select,
      isRequired: true,
      options: ['low', 'high'],
      orderIndex: 0,
    };

    it('throws NotFoundException when the field does not belong to the form type', async () => {
      prisma.formField.findUnique.mockResolvedValue({
        ...existingField,
        formTypeId: 'other-form-type',
      });

      await expect(
        service.updateField(formType.id, existingField.id, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('validates options against the resulting field type when only fieldType changes', async () => {
      prisma.formField.findUnique.mockResolvedValue({
        ...existingField,
        options: null,
        fieldType: FormFieldType.text,
      });

      await expect(
        service.updateField(formType.id, existingField.id, {
          fieldType: FormFieldType.select,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows clearing options when switching to a non-select field type', async () => {
      prisma.formField.findUnique.mockResolvedValue(existingField);
      prisma.formField.update.mockResolvedValue({});

      await expect(
        service.updateField(formType.id, existingField.id, {
          fieldType: FormFieldType.text,
          options: null,
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('reorderFields', () => {
    beforeEach(() => {
      prisma.formType.findUnique.mockResolvedValue({ ...formType, fields: [] });
    });

    it('rejects a payload missing one of the current field ids', async () => {
      prisma.formField.findMany.mockResolvedValue([
        { id: 'field-1' },
        { id: 'field-2' },
      ]);

      await expect(
        service.reorderFields(formType.id, ['field-1']),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a payload with an id that does not belong to the form type', async () => {
      prisma.formField.findMany.mockResolvedValue([{ id: 'field-1' }]);

      await expect(
        service.reorderFields(formType.id, ['field-1', 'field-unknown']),
      ).rejects.toThrow(BadRequestException);
    });

    it('rewrites order_index for a matching, reordered id list', async () => {
      prisma.formField.findMany.mockResolvedValue([
        { id: 'field-1' },
        { id: 'field-2' },
      ]);
      prisma.$transaction.mockResolvedValue([]);

      await service.reorderFields(formType.id, ['field-2', 'field-1']);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.formField.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'field-2' },
        data: { orderIndex: 0 },
      });
      expect(prisma.formField.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'field-1' },
        data: { orderIndex: 1 },
      });
    });
  });
});
