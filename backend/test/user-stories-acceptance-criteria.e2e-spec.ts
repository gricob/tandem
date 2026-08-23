import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('User stories and acceptance criteria (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const jwtService = moduleFixture.get(JwtService);
    token = await jwtService.signAsync({ sub: 'shared' });
  });

  afterEach(async () => {
    await app.close();
  });

  function authed(
    method: 'get' | 'post' | 'patch' | 'put' | 'delete',
    url: string,
  ) {
    return request(app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${token}`);
  }

  async function createFormTemplate(name: string) {
    const response = await authed('post', '/api/v1/form-templates')
      .send({ name })
      .expect(201);
    return (response.body as { id: string }).id;
  }

  async function createWorkstream(name: string) {
    const response = await authed('post', '/api/v1/workstreams')
      .send({ name })
      .expect(201);
    return (response.body as { id: string }).id;
  }

  async function createDeliverable(name: string) {
    const workstreamId = await createWorkstream(name);
    const response = await authed(
      'post',
      `/api/v1/workstreams/${workstreamId}/deliverables`,
    )
      .send({ name })
      .expect(201);
    return (response.body as { id: string }).id;
  }

  it('rejects requests without a session token', () => {
    return request(app.getHttpServer())
      .post('/api/v1/deliverables/missing/user-stories')
      .expect(401);
  });

  it('rejects creating a user story without a name', async () => {
    const deliverableId = await createDeliverable('Onboarding revamp');
    const formTemplateId = await createFormTemplate('User story');

    return authed('post', `/api/v1/deliverables/${deliverableId}/user-stories`)
      .send({ formTemplateId })
      .expect(400);
  });

  it('rejects creating a user story with a form_template_id that does not exist', async () => {
    const deliverableId = await createDeliverable('Onboarding revamp');

    return authed('post', `/api/v1/deliverables/${deliverableId}/user-stories`)
      .send({ formTemplateId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', name: 'Sign up' })
      .expect(400);
  });

  it('returns 404 when adding a user story to a non-existent deliverable', async () => {
    const formTemplateId = await createFormTemplate('User story');

    return authed('post', '/api/v1/deliverables/missing/user-stories')
      .send({ formTemplateId, name: 'Sign up' })
      .expect(404);
  });

  it('rejects creating an acceptance criterion without a form_template_id', async () => {
    const deliverableId = await createDeliverable('Onboarding revamp');
    const formTemplateId = await createFormTemplate('User story');
    const userStoryResponse = await authed(
      'post',
      `/api/v1/deliverables/${deliverableId}/user-stories`,
    )
      .send({ formTemplateId, name: 'Sign up' })
      .expect(201);
    const userStoryId = (userStoryResponse.body as { id: string }).id;

    return authed(
      'post',
      `/api/v1/user-stories/${userStoryId}/acceptance-criteria`,
    )
      .send({})
      .expect(400);
  });

  it('creates an acceptance criterion with no name or description of its own', async () => {
    const deliverableId = await createDeliverable('Onboarding revamp');
    const userStoryTemplateId = await createFormTemplate('User story');
    const acceptanceCriterionTemplateId = await createFormTemplate(
      'Acceptance criterion',
    );
    const userStoryResponse = await authed(
      'post',
      `/api/v1/deliverables/${deliverableId}/user-stories`,
    )
      .send({ formTemplateId: userStoryTemplateId, name: 'Sign up' })
      .expect(201);
    const userStoryId = (userStoryResponse.body as { id: string }).id;

    const criterionResponse = await authed(
      'post',
      `/api/v1/user-stories/${userStoryId}/acceptance-criteria`,
    )
      .send({ formTemplateId: acceptanceCriterionTemplateId })
      .expect(201);

    expect(criterionResponse.body).not.toHaveProperty('name');
    expect(criterionResponse.body).not.toHaveProperty('description');
  });

  it('returns 404 when adding an acceptance criterion to a non-existent user story', async () => {
    const formTemplateId = await createFormTemplate('Acceptance criterion');

    return authed('post', '/api/v1/user-stories/missing/acceptance-criteria')
      .send({ formTemplateId })
      .expect(404);
  });

  it('covers the full lifecycle: create, embed in deliverable, reorder, delete', async () => {
    const deliverableId = await createDeliverable('Onboarding revamp');

    const userStoryTemplateId = await createFormTemplate('User story');
    await authed('post', `/api/v1/form-templates/${userStoryTemplateId}/fields`)
      .send({ label: 'As a', fieldType: 'text', isRequired: true })
      .expect(201);

    const acceptanceCriterionTemplateId = await createFormTemplate(
      'Acceptance criterion',
    );

    const story1Response = await authed(
      'post',
      `/api/v1/deliverables/${deliverableId}/user-stories`,
    )
      .send({ formTemplateId: userStoryTemplateId, name: 'Sign up' })
      .expect(201);
    const story1 = story1Response.body as {
      id: string;
      orderIndex: number;
      fields: { id: string; label: string }[];
      acceptanceCriteria: unknown[];
    };
    expect(story1.orderIndex).toBe(0);
    expect(story1.fields).toHaveLength(1);
    expect(story1.fields[0]).toMatchObject({ label: 'As a' });
    expect(story1.acceptanceCriteria).toEqual([]);
    const story1Id = story1.id;

    const story2Response = await authed(
      'post',
      `/api/v1/deliverables/${deliverableId}/user-stories`,
    )
      .send({ formTemplateId: userStoryTemplateId, name: 'Log in' })
      .expect(201);
    const story2 = story2Response.body as { id: string; orderIndex: number };
    expect(story2.orderIndex).toBe(1);
    const story2Id = story2.id;

    const criterion1Response = await authed(
      'post',
      `/api/v1/user-stories/${story1Id}/acceptance-criteria`,
    )
      .send({ formTemplateId: acceptanceCriterionTemplateId })
      .expect(201);
    const criterion1 = criterion1Response.body as {
      id: string;
      orderIndex: number;
      userStoryId: string;
    };
    expect(criterion1.orderIndex).toBe(0);
    expect(criterion1.userStoryId).toBe(story1Id);
    const criterion1Id = criterion1.id;

    const criterion2Response = await authed(
      'post',
      `/api/v1/user-stories/${story1Id}/acceptance-criteria`,
    )
      .send({ formTemplateId: acceptanceCriterionTemplateId })
      .expect(201);
    const criterion2Id = (criterion2Response.body as { id: string }).id;

    const deliverableResponse = await authed(
      'get',
      `/api/v1/deliverables/${deliverableId}`,
    ).expect(200);
    const deliverable = deliverableResponse.body as {
      userStories: {
        id: string;
        acceptanceCriteria: { id: string }[];
      }[];
    };
    expect(deliverable.userStories.map((story) => story.id)).toEqual([
      story1Id,
      story2Id,
    ]);
    expect(
      deliverable.userStories[0].acceptanceCriteria.map((c) => c.id),
    ).toEqual([criterion1Id, criterion2Id]);
    expect(deliverable.userStories[1].acceptanceCriteria).toEqual([]);

    await authed(
      'put',
      `/api/v1/user-stories/${story1Id}/acceptance-criteria/order`,
    )
      .send({ acceptanceCriteriaIds: [criterion1Id] })
      .expect(400);

    const reorderedCriteria = await authed(
      'put',
      `/api/v1/user-stories/${story1Id}/acceptance-criteria/order`,
    )
      .send({ acceptanceCriteriaIds: [criterion2Id, criterion1Id] })
      .expect(200);
    expect(
      (reorderedCriteria.body as { id: string }[]).map((c) => c.id),
    ).toEqual([criterion2Id, criterion1Id]);

    await authed(
      'put',
      `/api/v1/deliverables/${deliverableId}/user-stories/order`,
    )
      .send({ userStoryIds: [story1Id] })
      .expect(400);

    const reorderedStories = await authed(
      'put',
      `/api/v1/deliverables/${deliverableId}/user-stories/order`,
    )
      .send({ userStoryIds: [story2Id, story1Id] })
      .expect(200);
    expect(
      (reorderedStories.body as { id: string }[]).map((s) => s.id),
    ).toEqual([story2Id, story1Id]);

    await authed(
      'delete',
      `/api/v1/user-stories/${story1Id}/acceptance-criteria/${criterion1Id}`,
    ).expect(204);
    await authed('get', `/api/v1/forms/${criterion1Id}`).expect(404);

    await authed(
      'delete',
      `/api/v1/deliverables/${deliverableId}/user-stories/${story1Id}`,
    ).expect(204);

    await authed('get', `/api/v1/forms/${story1Id}`).expect(404);
    await authed('get', `/api/v1/forms/${criterion2Id}`).expect(404);

    const deliverableAfterDelete = await authed(
      'get',
      `/api/v1/deliverables/${deliverableId}`,
    ).expect(200);
    expect(
      (
        deliverableAfterDelete.body as { userStories: { id: string }[] }
      ).userStories.map((s) => s.id),
    ).toEqual([story2Id]);

    await authed(
      'delete',
      `/api/v1/deliverables/${deliverableId}/user-stories/${story1Id}`,
    ).expect(404);
  });

  it('deleting the form behind a user story removes it and its acceptance criteria', async () => {
    const deliverableId = await createDeliverable('Onboarding revamp');
    const userStoryTemplateId = await createFormTemplate('User story');
    const acceptanceCriterionTemplateId = await createFormTemplate(
      'Acceptance criterion',
    );

    const storyResponse = await authed(
      'post',
      `/api/v1/deliverables/${deliverableId}/user-stories`,
    )
      .send({ formTemplateId: userStoryTemplateId, name: 'Sign up' })
      .expect(201);
    const storyId = (storyResponse.body as { id: string }).id;

    const criterionResponse = await authed(
      'post',
      `/api/v1/user-stories/${storyId}/acceptance-criteria`,
    )
      .send({ formTemplateId: acceptanceCriterionTemplateId })
      .expect(201);
    const criterionId = (criterionResponse.body as { id: string }).id;

    await authed('delete', `/api/v1/forms/${storyId}`).expect(204);

    await authed('get', `/api/v1/forms/${criterionId}`).expect(404);
    const deliverableResponse = await authed(
      'get',
      `/api/v1/deliverables/${deliverableId}`,
    ).expect(200);
    expect(
      (deliverableResponse.body as { userStories: unknown[] }).userStories,
    ).toEqual([]);
  });

  it('deleting a deliverable removes its user stories, acceptance criteria, and their forms', async () => {
    const deliverableId = await createDeliverable('Onboarding revamp');
    const userStoryTemplateId = await createFormTemplate('User story');
    const acceptanceCriterionTemplateId = await createFormTemplate(
      'Acceptance criterion',
    );

    const storyResponse = await authed(
      'post',
      `/api/v1/deliverables/${deliverableId}/user-stories`,
    )
      .send({ formTemplateId: userStoryTemplateId, name: 'Sign up' })
      .expect(201);
    const storyId = (storyResponse.body as { id: string }).id;

    const criterionResponse = await authed(
      'post',
      `/api/v1/user-stories/${storyId}/acceptance-criteria`,
    )
      .send({ formTemplateId: acceptanceCriterionTemplateId })
      .expect(201);
    const criterionId = (criterionResponse.body as { id: string }).id;

    await authed('delete', `/api/v1/deliverables/${deliverableId}`).expect(204);

    await authed('get', `/api/v1/deliverables/${deliverableId}`).expect(404);
    await authed('get', `/api/v1/forms/${storyId}`).expect(404);
    await authed('get', `/api/v1/forms/${criterionId}`).expect(404);
  });
});
