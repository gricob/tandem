import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStoriesService } from '../user-stories/user-stories.service';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';
import { UpdateDeliverableDto } from './dto/update-deliverable.dto';

@Injectable()
export class DeliverablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userStoriesService: UserStoriesService,
  ) {}

  async createDeliverableForWorkstream(
    workstreamId: string,
    dto: CreateDeliverableDto,
  ) {
    await this.assertWorkstreamExists(workstreamId);

    const lastDeliverable = await this.prisma.deliverable.findFirst({
      where: { workstreamId },
      orderBy: { orderIndex: 'desc' },
    });
    const orderIndex = lastDeliverable ? lastDeliverable.orderIndex + 1 : 0;

    const deliverable = await this.prisma.deliverable.create({
      data: {
        id: ulid(),
        workstreamId,
        orderIndex,
        name: dto.name,
        description: dto.description,
      },
    });
    return { ...deliverable, userStories: [] };
  }

  async reorderDeliverables(workstreamId: string, deliverableIds: string[]) {
    await this.assertWorkstreamExists(workstreamId);

    const existing = await this.prisma.deliverable.findMany({
      where: { workstreamId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((deliverable) => deliverable.id));
    const submittedIds = new Set(deliverableIds);
    const matchesExactly =
      existingIds.size === submittedIds.size &&
      [...existingIds].every((id) => submittedIds.has(id));
    if (!matchesExactly) {
      throw new BadRequestException(
        "The submitted deliverable ids must exactly match the workstream's current deliverables.",
      );
    }

    await this.prisma.$transaction(
      deliverableIds.map((id, index) =>
        this.prisma.deliverable.update({
          where: { id },
          data: { orderIndex: index },
        }),
      ),
    );

    return this.findAllForWorkstream(workstreamId);
  }

  async findAllForWorkstream(workstreamId: string) {
    const deliverables = await this.prisma.deliverable.findMany({
      where: { workstreamId },
      orderBy: { orderIndex: 'asc' },
    });
    return Promise.all(
      deliverables.map(async (deliverable) => ({
        ...deliverable,
        userStories: await this.userStoriesService.findAllForDeliverable(
          deliverable.id,
        ),
      })),
    );
  }

  async getDeliverable(deliverableId: string) {
    const deliverable = await this.assertDeliverableExists(deliverableId);
    const userStories =
      await this.userStoriesService.findAllForDeliverable(deliverableId);
    return { ...deliverable, userStories };
  }

  async updateDeliverable(deliverableId: string, dto: UpdateDeliverableDto) {
    await this.assertDeliverableExists(deliverableId);
    const deliverable = await this.prisma.deliverable.update({
      where: { id: deliverableId },
      data: { name: dto.name, description: dto.description },
    });
    const userStories =
      await this.userStoriesService.findAllForDeliverable(deliverableId);
    return { ...deliverable, userStories };
  }

  async deleteDeliverable(deliverableId: string): Promise<void> {
    await this.assertDeliverableExists(deliverableId);
    const operations =
      await this.buildDeleteOperationsForDeliverable(deliverableId);
    await this.prisma.$transaction(operations);
  }

  /**
   * Builds the delete operations for every deliverable on the workstream
   * (and everything beneath them), so the caller can combine them with its
   * own workstream-delete operation into a single transaction.
   */
  async buildDeleteOperationsForWorkstream(
    workstreamId: string,
  ): Promise<Prisma.PrismaPromise<unknown>[]> {
    const deliverables = await this.prisma.deliverable.findMany({
      where: { workstreamId },
      select: { id: true },
    });
    const operations = await Promise.all(
      deliverables.map((deliverable) =>
        this.buildDeleteOperationsForDeliverable(deliverable.id),
      ),
    );
    return operations.flat();
  }

  private async buildDeleteOperationsForDeliverable(
    deliverableId: string,
  ): Promise<Prisma.PrismaPromise<unknown>[]> {
    const operations =
      await this.userStoriesService.buildDeleteFormOperationsForDeliverable(
        deliverableId,
      );
    return [
      ...operations,
      this.prisma.deliverable.delete({ where: { id: deliverableId } }),
    ];
  }

  private async assertDeliverableExists(deliverableId: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
    });
    if (!deliverable) {
      throw new NotFoundException(`Deliverable ${deliverableId} not found.`);
    }
    return deliverable;
  }

  private async assertWorkstreamExists(workstreamId: string): Promise<void> {
    const workstream = await this.prisma.workstream.findUnique({
      where: { id: workstreamId },
    });
    if (!workstream) {
      throw new NotFoundException(`Workstream ${workstreamId} not found.`);
    }
  }
}
