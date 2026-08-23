import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Deliverables (e2e)', () => {
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

  function authed(method: 'get' | 'post' | 'patch' | 'delete', url: string) {
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

  async function createDeliverable(workstreamId: string, name: string) {
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
      .get('/api/v1/deliverables/missing')
      .expect(401);
  });

  it('returns 404 for a non-existent deliverable', () => {
    return authed('get', '/api/v1/deliverables/missing').expect(404);
  });

  it('covers the full lifecycle: create, view, edit, delete', async () => {
    const workstreamId = await createWorkstream('Platform');

    const createResponse = await authed(
      'post',
      `/api/v1/workstreams/${workstreamId}/deliverables`,
    )
      .send({ name: 'Reporting dashboard', description: 'Internal metrics' })
      .expect(201);

    const deliverableId = (createResponse.body as { id: string }).id;
    expect(createResponse.body).toMatchObject({
      workstreamId,
      orderIndex: 0,
      name: 'Reporting dashboard',
      description: 'Internal metrics',
    });

    await authed('get', `/api/v1/deliverables/${deliverableId}`)
      .expect(200)
      .expect(({ body }: { body: { name: string } }) => {
        expect(body.name).toBe('Reporting dashboard');
      });

    await authed('patch', `/api/v1/deliverables/${deliverableId}`)
      .send({ name: '' })
      .expect(400);

    await authed('patch', `/api/v1/deliverables/${deliverableId}`)
      .send({ name: 'Reporting dashboard v2' })
      .expect(200)
      .expect(({ body }: { body: { name: string } }) => {
        expect(body.name).toBe('Reporting dashboard v2');
      });

    await authed('delete', `/api/v1/deliverables/${deliverableId}`).expect(204);

    await authed('get', `/api/v1/deliverables/${deliverableId}`).expect(404);
  });

  it('leaves a deliverable unaffected by a workstreamId in the edit payload', async () => {
    const workstreamId = await createWorkstream('Platform');
    const otherWorkstreamId = await createWorkstream('Growth');
    const deliverableId = await createDeliverable(
      workstreamId,
      'Reporting dashboard',
    );

    const response = await authed(
      'patch',
      `/api/v1/deliverables/${deliverableId}`,
    )
      .send({ name: 'Reporting dashboard v2', workstreamId: otherWorkstreamId })
      .expect(200);

    expect(response.body).toMatchObject({ workstreamId });
  });
});
