import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStoriesService } from '../user-stories/user-stories.service';
import { DeliverablesService } from './deliverables.service';

type MockPrismaService = {
  workstream: {
    findUnique: jest.Mock;
  };
  deliverable: {
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
    workstream: {
      findUnique: jest.fn(),
    },
    deliverable: {
      create: jest.fn(),
      findFirst: jest.fn(),
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

type MockUserStoriesService = {
  findAllForDeliverable: jest.Mock;
  buildDeleteFormOperationsForDeliverable: jest.Mock;
};

function createMockUserStoriesService(): MockUserStoriesService {
  return {
    findAllForDeliverable: jest.fn().mockResolvedValue([]),
    buildDeleteFormOperationsForDeliverable: jest.fn().mockResolvedValue([]),
  };
}

describe('DeliverablesService', () => {
  let service: DeliverablesService;
  let prisma: MockPrismaService;
  let userStoriesService: MockUserStoriesService;

  const workstream = {
    id: 'workstream-1',
    name: 'Platform',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const deliverable = {
    id: 'deliverable-1',
    workstreamId: workstream.id,
    orderIndex: 0,
    name: 'Reporting dashboard',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();
    userStoriesService = createMockUserStoriesService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliverablesService,
        { provide: PrismaService, useValue: prisma },
        { provide: UserStoriesService, useValue: userStoriesService },
      ],
    }).compile();

    service = module.get<DeliverablesService>(DeliverablesService);
  });

  describe('createDeliverableForWorkstream', () => {
    it('throws NotFoundException when the workstream does not exist', async () => {
      prisma.workstream.findUnique.mockResolvedValue(null);

      await expect(
        service.createDeliverableForWorkstream(workstream.id, {
          name: 'Reporting dashboard',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.deliverable.create).not.toHaveBeenCalled();
    });

    it('creates a deliverable with the next order index for that workstream', async () => {
      prisma.workstream.findUnique.mockResolvedValue(workstream);
      prisma.deliverable.findFirst.mockResolvedValue({ orderIndex: 2 });
      prisma.deliverable.create.mockResolvedValue({
        ...deliverable,
        orderIndex: 3,
      });

      const result = await service.createDeliverableForWorkstream(
        workstream.id,
        { name: 'Reporting dashboard' },
      );

      expect(prisma.deliverable.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workstreamId: workstream.id,
            orderIndex: 3,
            name: 'Reporting dashboard',
          }) as unknown,
        }),
      );
      expect(result).toEqual({
        ...deliverable,
        orderIndex: 3,
        userStories: [],
      });
    });
  });

  describe('reorderDeliverables', () => {
    it('throws NotFoundException when the workstream does not exist', async () => {
      prisma.workstream.findUnique.mockResolvedValue(null);

      await expect(
        service.reorderDeliverables(workstream.id, ['a', 'b']),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a payload that does not exactly match the current deliverables', async () => {
      prisma.workstream.findUnique.mockResolvedValue(workstream);
      prisma.deliverable.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);

      await expect(
        service.reorderDeliverables(workstream.id, ['a']),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rewrites order indexes to match the submitted order', async () => {
      prisma.workstream.findUnique.mockResolvedValue(workstream);
      prisma.deliverable.findMany
        .mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }])
        .mockResolvedValueOnce([]);
      prisma.deliverable.update.mockResolvedValue(deliverable);

      await service.reorderDeliverables(workstream.id, ['b', 'a']);

      expect(prisma.deliverable.update).toHaveBeenCalledWith({
        where: { id: 'b' },
        data: { orderIndex: 0 },
      });
      expect(prisma.deliverable.update).toHaveBeenCalledWith({
        where: { id: 'a' },
        data: { orderIndex: 1 },
      });
    });
  });

  describe('getDeliverable', () => {
    it('throws NotFoundException when the deliverable does not exist', async () => {
      prisma.deliverable.findUnique.mockResolvedValue(null);

      await expect(service.getDeliverable('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the deliverable with its user stories when found', async () => {
      prisma.deliverable.findUnique.mockResolvedValue(deliverable);

      await expect(service.getDeliverable(deliverable.id)).resolves.toEqual({
        ...deliverable,
        userStories: [],
      });
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

      expect(
        userStoriesService.buildDeleteFormOperationsForDeliverable,
      ).toHaveBeenCalledWith(deliverable.id);
      expect(prisma.deliverable.delete).toHaveBeenCalledWith({
        where: { id: deliverable.id },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws NotFoundException instead of deleting a missing deliverable', async () => {
      prisma.deliverable.findUnique.mockResolvedValue(null);

      await expect(service.deleteDeliverable('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.deliverable.delete).not.toHaveBeenCalled();
    });
  });

  describe('buildDeleteOperationsForWorkstream', () => {
    it('flattens delete operations across every deliverable on the workstream', async () => {
      prisma.deliverable.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
      userStoriesService.buildDeleteFormOperationsForDeliverable
        .mockResolvedValueOnce(['form-op-a'])
        .mockResolvedValueOnce(['form-op-b']);
      prisma.deliverable.delete.mockImplementation(
        (args: { where: { id: string } }) => `delete-${args.where.id}`,
      );

      const operations = await service.buildDeleteOperationsForWorkstream(
        workstream.id,
      );

      expect(operations).toEqual([
        'form-op-a',
        'delete-a',
        'form-op-b',
        'delete-b',
      ]);
      expect(
        userStoriesService.buildDeleteFormOperationsForDeliverable,
      ).toHaveBeenCalledWith('a');
      expect(
        userStoriesService.buildDeleteFormOperationsForDeliverable,
      ).toHaveBeenCalledWith('b');
    });
  });
});
