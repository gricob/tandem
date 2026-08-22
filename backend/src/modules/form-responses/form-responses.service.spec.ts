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
    formId: 'form-1',
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
    formId: 'form-1',
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
    formTemplateId: 'form-template-1',
    name: 'Bug report #1',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    fields: [requiredTextField, optionalSelectField],
  };

  const conditionalRequiredField = {
    id: 'field-plan-details',
    formId: 'form-1',
    label: 'Plan details',
    fieldType: FormFieldType.text,
    isRequired: true,
    options: null,
    condition: {
      field: optionalSelectField.id,
      operator: 'equals',
      value: 'High',
    },
    orderIndex: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const formWithConditionalField = {
    ...form,
    fields: [requiredTextField, optionalSelectField, conditionalRequiredField],
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

    it('accepts a value for a field that is currently hidden by its condition', async () => {
      prisma.form.findUnique.mockResolvedValue(formWithConditionalField);
      prisma.formResponse.findUnique.mockResolvedValue(null);
      prisma.formResponse.create.mockResolvedValue({
        id: 'response-1',
        formId: form.id,
        responseData: {
          [optionalSelectField.id]: 'Low',
          [conditionalRequiredField.id]: 'Some plan',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // severity is 'Low', so plan-details' `equals High` condition is not
      // met and the field is hidden - saving a value for it is still accepted.
      await expect(
        service.saveResponse(form.id, {
          [optionalSelectField.id]: 'Low',
          [conditionalRequiredField.id]: 'Some plan',
        }),
      ).resolves.toBeDefined();
      expect(prisma.formResponse.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          responseData: {
            [optionalSelectField.id]: 'Low',
            [conditionalRequiredField.id]: 'Some plan',
          },
        }) as unknown,
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

    it('does not let a hidden required field block completeness', async () => {
      prisma.form.findUnique.mockResolvedValue(formWithConditionalField);
      prisma.formResponse.findUnique.mockResolvedValue({
        id: 'response-1',
        formId: form.id,
        // severity is 'Low' -> plan-details' condition is unmet -> hidden,
        // and its own `is_required` never gets evaluated despite no value.
        responseData: {
          [requiredTextField.id]: 'Alice',
          [optionalSelectField.id]: 'Low',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.getResponse(form.id)).resolves.toMatchObject({
        isComplete: true,
      });
    });

    it('still blocks completeness for a visible required field', async () => {
      prisma.form.findUnique.mockResolvedValue(formWithConditionalField);
      prisma.formResponse.findUnique.mockResolvedValue({
        id: 'response-1',
        formId: form.id,
        // severity is 'High' -> plan-details' condition is met -> visible
        // and required, but left unanswered.
        responseData: {
          [requiredTextField.id]: 'Alice',
          [optionalSelectField.id]: 'High',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.getResponse(form.id)).resolves.toMatchObject({
        isComplete: false,
      });
    });

    it("does not let a since-hidden field's stale value satisfy completeness on its own", async () => {
      prisma.form.findUnique.mockResolvedValue(formWithConditionalField);
      prisma.formResponse.findUnique.mockResolvedValue({
        id: 'response-1',
        formId: form.id,
        // plan-details was answered while severity was 'High', but severity
        // has since changed to 'Low' - plan-details is hidden again, and its
        // stale answer must not be required or counted either way.
        responseData: {
          [requiredTextField.id]: 'Alice',
          [optionalSelectField.id]: 'Low',
          [conditionalRequiredField.id]: 'Old plan',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.getResponse(form.id)).resolves.toMatchObject({
        isComplete: true,
      });
    });
  });
});
