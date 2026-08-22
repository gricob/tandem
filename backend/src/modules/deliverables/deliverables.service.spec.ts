import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliverablesService } from './deliverables.service';

type MockPrismaService = {
  deliverable: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

function createMockPrisma(): MockPrismaService {
  return {
    deliverable: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('DeliverablesService', () => {
  let service: DeliverablesService;
  let prisma: MockPrismaService;

  const deliverable = {
    id: 'deliverable-1',
    name: 'Reporting dashboard',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliverablesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DeliverablesService>(DeliverablesService);
  });

  describe('getDeliverable', () => {
    it('throws NotFoundException when the deliverable does not exist', async () => {
      prisma.deliverable.findUnique.mockResolvedValue(null);

      await expect(service.getDeliverable('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the deliverable when found', async () => {
      prisma.deliverable.findUnique.mockResolvedValue(deliverable);

      await expect(service.getDeliverable(deliverable.id)).resolves.toEqual(
        deliverable,
      );
    });
  });

  describe('updateDeliverable', () => {
    it('throws NotFoundException instead of updating a missing deliverable', async () => {
      prisma.deliverable.findUnique.mockResolvedValue(null);

      await expect(
        service.updateDeliverable('missing', { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.deliverable.update).not.toHaveBeenCalled();
    });

    it('updates an existing deliverable', async () => {
      prisma.deliverable.findUnique.mockResolvedValue(deliverable);
      prisma.deliverable.update.mockResolvedValue({
        ...deliverable,
        name: 'New name',
      });

      await service.updateDeliverable(deliverable.id, { name: 'New name' });

      expect(prisma.deliverable.update).toHaveBeenCalledWith({
        where: { id: deliverable.id },
        data: { name: 'New name', description: undefined },
      });
    });
  });

  describe('deleteDeliverable', () => {
    it('deletes an existing deliverable', async () => {
      prisma.deliverable.findUnique.mockResolvedValue(deliverable);
      prisma.deliverable.delete.mockResolvedValue(deliverable);

      await service.deleteDeliverable(deliverable.id);

      expect(prisma.deliverable.delete).toHaveBeenCalledWith({
        where: { id: deliverable.id },
      });
    });

    it('throws NotFoundException instead of deleting a missing deliverable', async () => {
      prisma.deliverable.findUnique.mockResolvedValue(null);

      await expect(service.deleteDeliverable('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.deliverable.delete).not.toHaveBeenCalled();
    });
  });
});
