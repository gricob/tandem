import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Workstreams (e2e)', () => {
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

  async function createWorkstream(name: string) {
    const response = await authed('post', '/api/v1/workstreams')
      .send({ name })
      .expect(201);
    return (response.body as { id: string }).id;
  }

  async function createFormTemplate(name: string) {
    const response = await authed('post', '/api/v1/form-templates')
      .send({ name })
      .expect(201);
    return (response.body as { id: string }).id;
  }

  it('rejects requests without a session token', () => {
    return request(app.getHttpServer()).get('/api/v1/workstreams').expect(401);
  });

  it('rejects creating a workstream without a name', () => {
    return authed('post', '/api/v1/workstreams').send({}).expect(400);
  });

  it('returns 404 for a non-existent workstream', () => {
    return authed('get', '/api/v1/workstreams/missing').expect(404);
  });

  it('covers the full lifecycle: create, list, view, edit, delete', async () => {
    const createResponse = await authed('post', '/api/v1/workstreams')
      .send({ name: 'Platform', description: 'Core platform work' })
      .expect(201);

    const workstreamId = (createResponse.body as { id: string }).id;
    expect(createResponse.body).toMatchObject({
      name: 'Platform',
      description: 'Core platform work',
      deliverables: [],
    });

    const listResponse = await authed('get', '/api/v1/workstreams').expect(200);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: workstreamId })]),
    );

    await authed('get', `/api/v1/workstreams/${workstreamId}`)
      .expect(200)
      .expect(({ body }: { body: { name: string } }) => {
        expect(body.name).toBe('Platform');
      });

    await authed('patch', `/api/v1/workstreams/${workstreamId}`)
      .send({ name: '' })
      .expect(400);

    await authed('patch', `/api/v1/workstreams/${workstreamId}`)
      .send({ name: 'Platform v2' })
      .expect(200)
      .expect(({ body }: { body: { name: string } }) => {
        expect(body.name).toBe('Platform v2');
      });

    await authed('delete', `/api/v1/workstreams/${workstreamId}`).expect(204);

    await authed('get', `/api/v1/workstreams/${workstreamId}`).expect(404);
  });

  it('rejects editing a non-existent workstream', () => {
    return authed('patch', '/api/v1/workstreams/missing')
      .send({ name: 'New name' })
      .expect(404);
  });

  describe('adding deliverables to a workstream', () => {
    it('rejects a deliverable without a name', async () => {
      const workstreamId = await createWorkstream('Platform');

      return authed('post', `/api/v1/workstreams/${workstreamId}/deliverables`)
        .send({})
        .expect(400);
    });

    it('returns 404 when adding a deliverable to a non-existent workstream', () => {
      return authed('post', '/api/v1/workstreams/missing/deliverables')
        .send({ name: 'Reporting dashboard' })
        .expect(404);
    });

    it('appends deliverables with an incrementing order index', async () => {
      const workstreamId = await createWorkstream('Platform');

      const first = await authed(
        'post',
        `/api/v1/workstreams/${workstreamId}/deliverables`,
      )
        .send({ name: 'Reporting dashboard' })
        .expect(201);
      expect(first.body).toMatchObject({ workstreamId, orderIndex: 0 });

      const second = await authed(
        'post',
        `/api/v1/workstreams/${workstreamId}/deliverables`,
      )
        .send({ name: 'Billing overhaul' })
        .expect(201);
      expect(second.body).toMatchObject({ workstreamId, orderIndex: 1 });

      const workstream = await authed(
        'get',
        `/api/v1/workstreams/${workstreamId}`,
      ).expect(200);
      expect(
        (
          workstream.body as { deliverables: { id: string }[] }
        ).deliverables.map((d) => d.id),
      ).toEqual([
        (first.body as { id: string }).id,
        (second.body as { id: string }).id,
      ]);
    });
  });

  describe('reordering a workstream deliverables', () => {
    it('rejects a payload that does not exactly match the current deliverables', async () => {
      const workstreamId = await createWorkstream('Platform');
      const first = await authed(
        'post',
        `/api/v1/workstreams/${workstreamId}/deliverables`,
      )
        .send({ name: 'Reporting dashboard' })
        .expect(201);

      return authed(
        'put',
        `/api/v1/workstreams/${workstreamId}/deliverables/order`,
      )
        .send({ deliverableIds: [(first.body as { id: string }).id, 'bogus'] })
        .expect(400);
    });

    it('persists the new order', async () => {
      const workstreamId = await createWorkstream('Platform');
      const first = await authed(
        'post',
        `/api/v1/workstreams/${workstreamId}/deliverables`,
      )
        .send({ name: 'Reporting dashboard' })
        .expect(201);
      const second = await authed(
        'post',
        `/api/v1/workstreams/${workstreamId}/deliverables`,
      )
        .send({ name: 'Billing overhaul' })
        .expect(201);
      const firstId = (first.body as { id: string }).id;
      const secondId = (second.body as { id: string }).id;

      const reordered = await authed(
        'put',
        `/api/v1/workstreams/${workstreamId}/deliverables/order`,
      )
        .send({ deliverableIds: [secondId, firstId] })
        .expect(200);
      expect((reordered.body as { id: string }[]).map((d) => d.id)).toEqual([
        secondId,
        firstId,
      ]);

      const workstream = await authed(
        'get',
        `/api/v1/workstreams/${workstreamId}`,
      ).expect(200);
      expect(
        (
          workstream.body as { deliverables: { id: string }[] }
        ).deliverables.map((d) => d.id),
      ).toEqual([secondId, firstId]);
    });
  });

  describe('deleting a workstream', () => {
    it('returns 404 for a non-existent workstream', () => {
      return authed('delete', '/api/v1/workstreams/missing').expect(404);
    });

    it('leaves nothing orphaned when the workstream has deliverables with user stories and acceptance criteria', async () => {
      const workstreamId = await createWorkstream('Platform');
      const deliverableResponse = await authed(
        'post',
        `/api/v1/workstreams/${workstreamId}/deliverables`,
      )
        .send({ name: 'Onboarding revamp' })
        .expect(201);
      const deliverableId = (deliverableResponse.body as { id: string }).id;

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
      const criterionId = (criterionResponse.body as { id: string }).id;

      await authed('delete', `/api/v1/workstreams/${workstreamId}`).expect(204);

      await authed('get', `/api/v1/workstreams/${workstreamId}`).expect(404);
      await authed('get', `/api/v1/deliverables/${deliverableId}`).expect(404);
      await authed('get', `/api/v1/forms/${userStoryId}`).expect(404);
      await authed('get', `/api/v1/forms/${criterionId}`).expect(404);
    });
  });
});
