import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcceptanceCriterion, Prisma, UserStory } from '@prisma/client';
import { ulid } from 'ulid';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FORM_INCLUDE,
  FormsService,
  FormWithRelations,
} from '../forms/forms.service';
import { AcceptanceCriteriaService } from './acceptance-criteria.service';
import { CreateUserStoryDto } from './dto/create-user-story.dto';

type UserStoryWithRelations = UserStory & {
  form: FormWithRelations;
  acceptanceCriteria: (AcceptanceCriterion & { form: FormWithRelations })[];
};

const USER_STORY_INCLUDE = {
  form: { include: FORM_INCLUDE },
  acceptanceCriteria: {
    orderBy: { orderIndex: 'asc' as const },
    include: { form: { include: FORM_INCLUDE } },
  },
};

@Injectable()
export class UserStoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly formsService: FormsService,
    private readonly acceptanceCriteriaService: AcceptanceCriteriaService,
  ) {}

  async addUserStory(deliverableId: string, dto: CreateUserStoryDto) {
    await this.assertDeliverableExists(deliverableId);

    const userStoryId = ulid();
    const formOperations = await this.formsService.buildCreateFormOperations(
      userStoryId,
      dto,
    );

    const lastUserStory = await this.prisma.userStory.findFirst({
      where: { deliverableId },
      orderBy: { orderIndex: 'desc' },
    });
    const orderIndex = lastUserStory ? lastUserStory.orderIndex + 1 : 0;

    await this.prisma.$transaction([
      ...formOperations,
      this.prisma.userStory.create({
        data: { id: userStoryId, deliverableId, orderIndex },
      }),
    ]);

    return this.getUserStory(userStoryId);
  }

  async removeUserStory(
    deliverableId: string,
    userStoryId: string,
  ): Promise<void> {
    await this.getUserStoryOrThrow(deliverableId, userStoryId);
    await this.formsService.deleteForm(userStoryId);
  }

  async reorderUserStories(deliverableId: string, userStoryIds: string[]) {
    await this.assertDeliverableExists(deliverableId);

    const existing = await this.prisma.userStory.findMany({
      where: { deliverableId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((userStory) => userStory.id));
    const submittedIds = new Set(userStoryIds);
    const matchesExactly =
      existingIds.size === submittedIds.size &&
      [...existingIds].every((id) => submittedIds.has(id));
    if (!matchesExactly) {
      throw new BadRequestException(
        "The submitted user story ids must exactly match the deliverable's current user stories.",
      );
    }

    await this.prisma.$transaction(
      userStoryIds.map((id, index) =>
        this.prisma.userStory.update({
          where: { id },
          data: { orderIndex: index },
        }),
      ),
    );

    return this.findAllForDeliverable(deliverableId);
  }

  async findAllForDeliverable(deliverableId: string) {
    const userStories = await this.prisma.userStory.findMany({
      where: { deliverableId },
      include: USER_STORY_INCLUDE,
      orderBy: { orderIndex: 'asc' },
    });
    return userStories.map((userStory) => this.toUserStoryResponse(userStory));
  }

  async buildDeleteFormOperationsForDeliverable(
    deliverableId: string,
  ): Promise<Prisma.PrismaPromise<unknown>[]> {
    const userStories = await this.prisma.userStory.findMany({
      where: { deliverableId },
      select: { id: true },
    });
    const userStoryIds = userStories.map((userStory) => userStory.id);
    if (userStoryIds.length === 0) {
      return [];
    }

    const acceptanceCriteria = await this.prisma.acceptanceCriterion.findMany({
      where: { userStoryId: { in: userStoryIds } },
      select: { id: true },
    });
    const acceptanceCriteriaIds = acceptanceCriteria.map(
      (acceptanceCriterion) => acceptanceCriterion.id,
    );

    return [
      ...(acceptanceCriteriaIds.length
        ? [
            this.prisma.form.deleteMany({
              where: { id: { in: acceptanceCriteriaIds } },
            }),
          ]
        : []),
      this.prisma.form.deleteMany({ where: { id: { in: userStoryIds } } }),
    ];
  }

  private async getUserStory(userStoryId: string) {
    const userStory = await this.prisma.userStory.findUnique({
      where: { id: userStoryId },
      include: USER_STORY_INCLUDE,
    });
    if (!userStory) {
      throw new NotFoundException(`User story ${userStoryId} not found.`);
    }
    return this.toUserStoryResponse(userStory);
  }

  private async getUserStoryOrThrow(
    deliverableId: string,
    userStoryId: string,
  ): Promise<void> {
    const userStory = await this.prisma.userStory.findUnique({
      where: { id: userStoryId },
    });
    if (!userStory || userStory.deliverableId !== deliverableId) {
      throw new NotFoundException(
        `User story ${userStoryId} not found on deliverable ${deliverableId}.`,
      );
    }
  }

  private async assertDeliverableExists(deliverableId: string): Promise<void> {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
    });
    if (!deliverable) {
      throw new NotFoundException(`Deliverable ${deliverableId} not found.`);
    }
  }

  private toUserStoryResponse(userStory: UserStoryWithRelations) {
    return {
      ...this.formsService.toFormResponse(userStory.form),
      deliverableId: userStory.deliverableId,
      orderIndex: userStory.orderIndex,
      acceptanceCriteria: userStory.acceptanceCriteria.map(
        (acceptanceCriterion) =>
          this.acceptanceCriteriaService.toAcceptanceCriterionResponse(
            acceptanceCriterion,
          ),
      ),
    };
  }
}
