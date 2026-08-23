import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliverablesService } from '../deliverables/deliverables.service';
import { WorkstreamsService } from './workstreams.service';

type MockPrismaService = {
  workstream: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
};

function createMockPrisma(): MockPrismaService {
  return {
    workstream: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
}

type MockDeliverablesService = {
  findAllForWorkstream: jest.Mock;
  createDeliverableForWorkstream: jest.Mock;
  reorderDeliverables: jest.Mock;
  buildDeleteOperationsForWorkstream: jest.Mock;
};

function createMockDeliverablesService(): MockDeliverablesService {
  return {
    findAllForWorkstream: jest.fn().mockResolvedValue([]),
    createDeliverableForWorkstream: jest.fn(),
    reorderDeliverables: jest.fn(),
    buildDeleteOperationsForWorkstream: jest.fn().mockResolvedValue([]),
  };
}

describe('WorkstreamsService', () => {
  let service: WorkstreamsService;
  let prisma: MockPrismaService;
  let deliverablesService: MockDeliverablesService;

  const workstream = {
    id: 'workstream-1',
    name: 'Platform',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();
    deliverablesService = createMockDeliverablesService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkstreamsService,
        { provide: PrismaService, useValue: prisma },
        { provide: DeliverablesService, useValue: deliverablesService },
      ],
    }).compile();

    service = module.get<WorkstreamsService>(WorkstreamsService);
  });

  describe('createWorkstream', () => {
    it('creates a workstream with no deliverables yet', async () => {
      prisma.workstream.create.mockResolvedValue(workstream);

      await expect(
        service.createWorkstream({ name: 'Platform' }),
      ).resolves.toEqual({ ...workstream, deliverables: [] });
    });
  });

  describe('getWorkstream', () => {
    it('throws NotFoundException when the workstream does not exist', async () => {
      prisma.workstream.findUnique.mockResolvedValue(null);

      await expect(service.getWorkstream('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the workstream with its deliverables when found', async () => {
      prisma.workstream.findUnique.mockResolvedValue(workstream);

      await expect(service.getWorkstream(workstream.id)).resolves.toEqual({
        ...workstream,
        deliverables: [],
      });
    });
  });

  describe('updateWorkstream', () => {
    it('throws NotFoundException instead of updating a missing workstream', async () => {
      prisma.workstream.findUnique.mockResolvedValue(null);

      await expect(
        service.updateWorkstream('missing', { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.workstream.update).not.toHaveBeenCalled();
    });

    it('updates an existing workstream', async () => {
      prisma.workstream.findUnique.mockResolvedValue(workstream);
      prisma.workstream.update.mockResolvedValue({
        ...workstream,
        name: 'New name',
      });

      await service.updateWorkstream(workstream.id, { name: 'New name' });

      expect(prisma.workstream.update).toHaveBeenCalledWith({
        where: { id: workstream.id },
        data: { name: 'New name', description: undefined },
      });
    });
  });

  describe('deleteWorkstream', () => {
    it('throws NotFoundException instead of deleting a missing workstream', async () => {
      prisma.workstream.findUnique.mockResolvedValue(null);

      await expect(service.deleteWorkstream('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.workstream.delete).not.toHaveBeenCalled();
    });

    it('deletes every deliverable on the workstream, then the workstream, in one transaction', async () => {
      prisma.workstream.findUnique.mockResolvedValue(workstream);
      deliverablesService.buildDeleteOperationsForWorkstream.mockResolvedValue([
        'delete-deliverable-op',
      ]);
      prisma.workstream.delete.mockResolvedValue(workstream);

      await service.deleteWorkstream(workstream.id);

      expect(
        deliverablesService.buildDeleteOperationsForWorkstream,
      ).toHaveBeenCalledWith(workstream.id);
      expect(prisma.workstream.delete).toHaveBeenCalledWith({
        where: { id: workstream.id },
      });
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining(['delete-deliverable-op']) as unknown,
      );
    });
  });

  describe('addDeliverable', () => {
    it('delegates to DeliverablesService.createDeliverableForWorkstream', async () => {
      deliverablesService.createDeliverableForWorkstream.mockResolvedValue({
        id: 'deliverable-1',
      });

      await service.addDeliverable(workstream.id, { name: 'Dashboard' });

      expect(
        deliverablesService.createDeliverableForWorkstream,
      ).toHaveBeenCalledWith(workstream.id, { name: 'Dashboard' });
    });
  });

  describe('reorderDeliverables', () => {
    it('delegates to DeliverablesService.reorderDeliverables', async () => {
      deliverablesService.reorderDeliverables.mockResolvedValue([]);

      await service.reorderDeliverables(workstream.id, ['a', 'b']);

      expect(deliverablesService.reorderDeliverables).toHaveBeenCalledWith(
        workstream.id,
        ['a', 'b'],
      );
    });
  });
});
