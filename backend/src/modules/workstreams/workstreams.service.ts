import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliverablesService } from '../deliverables/deliverables.service';
import { CreateDeliverableDto } from '../deliverables/dto/create-deliverable.dto';
import { CreateWorkstreamDto } from './dto/create-workstream.dto';
import { UpdateWorkstreamDto } from './dto/update-workstream.dto';

@Injectable()
export class WorkstreamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deliverablesService: DeliverablesService,
  ) {}

  async createWorkstream(dto: CreateWorkstreamDto) {
    const workstream = await this.prisma.workstream.create({
      data: {
        id: ulid(),
        name: dto.name,
        description: dto.description,
      },
    });
    return { ...workstream, deliverables: [] };
  }

  async findAllWorkstreams() {
    const workstreams = await this.prisma.workstream.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(
      workstreams.map(async (workstream) => ({
        ...workstream,
        deliverables: await this.deliverablesService.findAllForWorkstream(
          workstream.id,
        ),
      })),
    );
  }

  async getWorkstream(workstreamId: string) {
    const workstream = await this.assertWorkstreamExists(workstreamId);
    const deliverables =
      await this.deliverablesService.findAllForWorkstream(workstreamId);
    return { ...workstream, deliverables };
  }

  async updateWorkstream(workstreamId: string, dto: UpdateWorkstreamDto) {
    await this.assertWorkstreamExists(workstreamId);
    const workstream = await this.prisma.workstream.update({
      where: { id: workstreamId },
      data: { name: dto.name, description: dto.description },
    });
    const deliverables =
      await this.deliverablesService.findAllForWorkstream(workstreamId);
    return { ...workstream, deliverables };
  }

  async deleteWorkstream(workstreamId: string): Promise<void> {
    await this.assertWorkstreamExists(workstreamId);
    const operations =
      await this.deliverablesService.buildDeleteOperationsForWorkstream(
        workstreamId,
      );
    await this.prisma.$transaction([
      ...operations,
      this.prisma.workstream.delete({ where: { id: workstreamId } }),
    ]);
  }

  async addDeliverable(workstreamId: string, dto: CreateDeliverableDto) {
    return this.deliverablesService.createDeliverableForWorkstream(
      workstreamId,
      dto,
    );
  }

  async reorderDeliverables(workstreamId: string, deliverableIds: string[]) {
    return this.deliverablesService.reorderDeliverables(
      workstreamId,
      deliverableIds,
    );
  }

  private async assertWorkstreamExists(workstreamId: string) {
    const workstream = await this.prisma.workstream.findUnique({
      where: { id: workstreamId },
    });
    if (!workstream) {
      throw new NotFoundException(`Workstream ${workstreamId} not found.`);
    }
    return workstream;
  }
}
