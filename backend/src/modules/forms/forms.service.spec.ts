import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { FormsService } from './forms.service';

type MockPrismaService = {
  formType: {
    findUnique: jest.Mock;
  };
  form: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

function createMockPrisma(): MockPrismaService {
  return {
    formType: {
      findUnique: jest.fn(),
    },
    form: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('FormsService', () => {
  let service: FormsService;
  let prisma: MockPrismaService;

  const formType = { id: 'form-type-1', name: 'Bug report' };
  const form = {
    id: 'form-1',
    formTypeId: formType.id,
    name: 'Bug report #1',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    formType: { name: formType.name },
  };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FormsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });

  describe('createForm', () => {
    it('rejects a form_type_id that does not exist', async () => {
      prisma.formType.findUnique.mockResolvedValue(null);

      await expect(
        service.createForm({ formTypeId: 'missing', name: 'A form' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.form.create).not.toHaveBeenCalled();
    });

    it('creates a form and flattens the form type name into the response', async () => {
      prisma.formType.findUnique.mockResolvedValue(formType);
      prisma.form.create.mockResolvedValue(form);

      await expect(
        service.createForm({ formTypeId: formType.id, name: form.name }),
      ).resolves.toEqual({
        id: form.id,
        formTypeId: form.formTypeId,
        formTypeName: formType.name,
        name: form.name,
        description: form.description,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      });
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
        expect.objectContaining({ formTypeName: formType.name }),
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
  });

  describe('getForm', () => {
    it('throws NotFoundException when the form does not exist', async () => {
      prisma.form.findUnique.mockResolvedValue(null);

      await expect(service.getForm('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the form with its form type name when found', async () => {
      prisma.form.findUnique.mockResolvedValue(form);

      await expect(service.getForm(form.id)).resolves.toMatchObject({
        id: form.id,
        formTypeName: formType.name,
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
