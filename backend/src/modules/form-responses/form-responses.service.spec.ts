import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FormFieldType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FormResponsesService } from './form-responses.service';

type MockPrismaService = {
  form: {
    findUnique: jest.Mock;
  };
  formResponse: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

function createMockPrisma(): MockPrismaService {
  return {
    form: {
      findUnique: jest.fn(),
    },
    formResponse: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('FormResponsesService', () => {
  let service: FormResponsesService;
  let prisma: MockPrismaService;

  const requiredTextField = {
    id: 'field-name',
    formTypeId: 'form-type-1',
    label: 'Name',
    fieldType: FormFieldType.text,
    isRequired: true,
    options: null,
    orderIndex: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const optionalSelectField = {
    id: 'field-severity',
    formTypeId: 'form-type-1',
    label: 'Severity',
    fieldType: FormFieldType.select,
    isRequired: false,
    options: ['Low', 'High'],
    orderIndex: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const form = {
    id: 'form-1',
    formTypeId: 'form-type-1',
    name: 'Bug report #1',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    formType: { fields: [requiredTextField, optionalSelectField] },
  };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormResponsesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FormResponsesService>(FormResponsesService);
  });

  describe('saveResponse', () => {
    it('throws NotFoundException when the form does not exist', async () => {
      prisma.form.findUnique.mockResolvedValue(null);

      await expect(
        service.saveResponse('missing', { [requiredTextField.id]: 'Alice' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a field id that does not belong to the form', async () => {
      prisma.form.findUnique.mockResolvedValue(form);

      await expect(
        service.saveResponse(form.id, { 'unknown-field': 'value' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.formResponse.create).not.toHaveBeenCalled();
    });

    it('rejects a value whose shape does not match the field type', async () => {
      prisma.form.findUnique.mockResolvedValue(form);

      await expect(
        service.saveResponse(form.id, { [requiredTextField.id]: 42 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a select value outside its options', async () => {
      prisma.form.findUnique.mockResolvedValue(form);

      await expect(
        service.saveResponse(form.id, {
          [optionalSelectField.id]: 'Critical',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a response on first save and computes incompleteness', async () => {
      prisma.form.findUnique.mockResolvedValue(form);
      prisma.formResponse.findUnique.mockResolvedValue(null);
      prisma.formResponse.create.mockResolvedValue({
        id: 'response-1',
        formId: form.id,
        responseData: { [optionalSelectField.id]: 'Low' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.saveResponse(form.id, {
        [optionalSelectField.id]: 'Low',
      });

      expect(prisma.formResponse.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          formId: form.id,
          responseData: { [optionalSelectField.id]: 'Low' },
        }) as unknown,
      });
      expect(result.isComplete).toBe(false);
    });

    it('merges into an existing response, leaving other keys untouched', async () => {
      prisma.form.findUnique.mockResolvedValue(form);
      prisma.formResponse.findUnique.mockResolvedValue({
        id: 'response-1',
        formId: form.id,
        responseData: { [optionalSelectField.id]: 'Low' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.formResponse.update.mockResolvedValue({
        id: 'response-1',
        formId: form.id,
        responseData: {
          [optionalSelectField.id]: 'Low',
          [requiredTextField.id]: 'Alice',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.saveResponse(form.id, {
        [requiredTextField.id]: 'Alice',
      });

      expect(prisma.formResponse.update).toHaveBeenCalledWith({
        where: { formId: form.id },
        data: {
          responseData: {
            [optionalSelectField.id]: 'Low',
            [requiredTextField.id]: 'Alice',
          },
        },
      });
      expect(result.isComplete).toBe(true);
    });

    it('clears a field when its value is explicitly null', async () => {
      prisma.form.findUnique.mockResolvedValue(form);
      prisma.formResponse.findUnique.mockResolvedValue({
        id: 'response-1',
        formId: form.id,
        responseData: {
          [optionalSelectField.id]: 'Low',
          [requiredTextField.id]: 'Alice',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.formResponse.update.mockResolvedValue({
        id: 'response-1',
        formId: form.id,
        responseData: { [requiredTextField.id]: 'Alice' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.saveResponse(form.id, { [optionalSelectField.id]: null });

      expect(prisma.formResponse.update).toHaveBeenCalledWith({
        where: { formId: form.id },
        data: { responseData: { [requiredTextField.id]: 'Alice' } },
      });
    });
  });

  describe('getResponse', () => {
    it('throws NotFoundException when the form does not exist', async () => {
      prisma.form.findUnique.mockResolvedValue(null);

      await expect(service.getResponse('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when no response has been saved yet', async () => {
      prisma.form.findUnique.mockResolvedValue(form);
      prisma.formResponse.findUnique.mockResolvedValue(null);

      await expect(service.getResponse(form.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the response with computed completeness', async () => {
      prisma.form.findUnique.mockResolvedValue(form);
      prisma.formResponse.findUnique.mockResolvedValue({
        id: 'response-1',
        formId: form.id,
        responseData: { [requiredTextField.id]: 'Alice' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.getResponse(form.id)).resolves.toMatchObject({
        responseData: { [requiredTextField.id]: 'Alice' },
        isComplete: true,
      });
    });
  });
});
