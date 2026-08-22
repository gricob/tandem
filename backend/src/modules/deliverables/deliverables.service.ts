import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';
import { UpdateDeliverableDto } from './dto/update-deliverable.dto';

@Injectable()
export class DeliverablesService {
  constructor(private readonly prisma: PrismaService) {}

  createDeliverable(dto: CreateDeliverableDto) {
    return this.prisma.deliverable.create({
      data: {
        id: ulid(),
        name: dto.name,
        description: dto.description,
      },
    });
  }

  findAllDeliverables() {
    return this.prisma.deliverable.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async getDeliverable(deliverableId: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
    });
    if (!deliverable) {
      throw new NotFoundException(`Deliverable ${deliverableId} not found.`);
    }
    return deliverable;
  }

  async updateDeliverable(deliverableId: string, dto: UpdateDeliverableDto) {
    await this.getDeliverable(deliverableId);
    return this.prisma.deliverable.update({
      where: { id: deliverableId },
      data: { name: dto.name, description: dto.description },
    });
  }

  async deleteDeliverable(deliverableId: string): Promise<void> {
    await this.getDeliverable(deliverableId);
    await this.prisma.deliverable.delete({ where: { id: deliverableId } });
  }
}
