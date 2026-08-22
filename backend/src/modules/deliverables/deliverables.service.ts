import { Injectable, NotFoundException } from '@nestjs/common';
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

  async createDeliverable(dto: CreateDeliverableDto) {
    const deliverable = await this.prisma.deliverable.create({
      data: {
        id: ulid(),
        name: dto.name,
        description: dto.description,
      },
    });
    return { ...deliverable, userStories: [] };
  }

  async findAllDeliverables() {
    const deliverables = await this.prisma.deliverable.findMany({
      orderBy: { createdAt: 'asc' },
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
      await this.userStoriesService.buildDeleteFormOperationsForDeliverable(
        deliverableId,
      );
    await this.prisma.$transaction([
      ...operations,
      this.prisma.deliverable.delete({ where: { id: deliverableId } }),
    ]);
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
}
