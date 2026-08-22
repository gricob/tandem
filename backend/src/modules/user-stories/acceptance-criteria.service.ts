import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcceptanceCriterion } from '@prisma/client';
import { ulid } from 'ulid';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FORM_INCLUDE,
  FormsService,
  FormWithRelations,
} from '../forms/forms.service';
import { CreateAcceptanceCriterionDto } from './dto/create-acceptance-criterion.dto';

type AcceptanceCriterionWithRelations = AcceptanceCriterion & {
  form: FormWithRelations;
};

const ACCEPTANCE_CRITERION_INCLUDE = {
  form: { include: FORM_INCLUDE },
};

@Injectable()
export class AcceptanceCriteriaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly formsService: FormsService,
  ) {}

  async addAcceptanceCriterion(
    userStoryId: string,
    dto: CreateAcceptanceCriterionDto,
  ) {
    await this.assertUserStoryExists(userStoryId);

    const acceptanceCriterionId = ulid();
    const formOperations = await this.formsService.buildCreateFormOperations(
      acceptanceCriterionId,
      dto,
    );

    const lastAcceptanceCriterion =
      await this.prisma.acceptanceCriterion.findFirst({
        where: { userStoryId },
        orderBy: { orderIndex: 'desc' },
      });
    const orderIndex = lastAcceptanceCriterion
      ? lastAcceptanceCriterion.orderIndex + 1
      : 0;

    await this.prisma.$transaction([
      ...formOperations,
      this.prisma.acceptanceCriterion.create({
        data: { id: acceptanceCriterionId, userStoryId, orderIndex },
      }),
    ]);

    return this.getAcceptanceCriterion(acceptanceCriterionId);
  }

  async removeAcceptanceCriterion(
    userStoryId: string,
    acceptanceCriterionId: string,
  ): Promise<void> {
    await this.getAcceptanceCriterionOrThrow(
      userStoryId,
      acceptanceCriterionId,
    );
    await this.formsService.deleteForm(acceptanceCriterionId);
  }

  async reorderAcceptanceCriteria(
    userStoryId: string,
    acceptanceCriteriaIds: string[],
  ) {
    await this.assertUserStoryExists(userStoryId);

    const existing = await this.prisma.acceptanceCriterion.findMany({
      where: { userStoryId },
      select: { id: true },
    });
    const existingIds = new Set(
      existing.map((acceptanceCriterion) => acceptanceCriterion.id),
    );
    const submittedIds = new Set(acceptanceCriteriaIds);
    const matchesExactly =
      existingIds.size === submittedIds.size &&
      [...existingIds].every((id) => submittedIds.has(id));
    if (!matchesExactly) {
      throw new BadRequestException(
        "The submitted acceptance criterion ids must exactly match the user story's current acceptance criteria.",
      );
    }

    await this.prisma.$transaction(
      acceptanceCriteriaIds.map((id, index) =>
        this.prisma.acceptanceCriterion.update({
          where: { id },
          data: { orderIndex: index },
        }),
      ),
    );

    return this.findAllForUserStory(userStoryId);
  }

  async findAllForUserStory(userStoryId: string) {
    const acceptanceCriteria = await this.prisma.acceptanceCriterion.findMany({
      where: { userStoryId },
      include: ACCEPTANCE_CRITERION_INCLUDE,
      orderBy: { orderIndex: 'asc' },
    });
    return acceptanceCriteria.map((acceptanceCriterion) =>
      this.toAcceptanceCriterionResponse(acceptanceCriterion),
    );
  }

  toAcceptanceCriterionResponse(
    acceptanceCriterion: AcceptanceCriterionWithRelations,
  ) {
    const {
      id,
      formTemplateId,
      formTemplateName,
      createdAt,
      updatedAt,
      fields,
    } = this.formsService.toFormResponse(acceptanceCriterion.form);
    return {
      id,
      formTemplateId,
      formTemplateName,
      createdAt,
      updatedAt,
      fields,
      userStoryId: acceptanceCriterion.userStoryId,
      orderIndex: acceptanceCriterion.orderIndex,
    };
  }

  private async getAcceptanceCriterion(acceptanceCriterionId: string) {
    const acceptanceCriterion =
      await this.prisma.acceptanceCriterion.findUnique({
        where: { id: acceptanceCriterionId },
        include: ACCEPTANCE_CRITERION_INCLUDE,
      });
    if (!acceptanceCriterion) {
      throw new NotFoundException(
        `Acceptance criterion ${acceptanceCriterionId} not found.`,
      );
    }
    return this.toAcceptanceCriterionResponse(acceptanceCriterion);
  }

  private async getAcceptanceCriterionOrThrow(
    userStoryId: string,
    acceptanceCriterionId: string,
  ): Promise<void> {
    const acceptanceCriterion =
      await this.prisma.acceptanceCriterion.findUnique({
        where: { id: acceptanceCriterionId },
      });
    if (
      !acceptanceCriterion ||
      acceptanceCriterion.userStoryId !== userStoryId
    ) {
      throw new NotFoundException(
        `Acceptance criterion ${acceptanceCriterionId} not found on user story ${userStoryId}.`,
      );
    }
  }

  private async assertUserStoryExists(userStoryId: string): Promise<void> {
    const userStory = await this.prisma.userStory.findUnique({
      where: { id: userStoryId },
    });
    if (!userStory) {
      throw new NotFoundException(`User story ${userStoryId} not found.`);
    }
  }
}
