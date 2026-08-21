import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ulid } from 'ulid';
import { AppModule } from './../src/app.module';

describe('Forms (e2e)', () => {
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

  async function createFormType(name: string) {
    const response = await authed('post', '/api/v1/form-types')
      .send({ name })
      .expect(201);
    return (response.body as { id: string }).id;
  }

  it('rejects requests without a session token', () => {
    return request(app.getHttpServer()).get('/api/v1/forms').expect(401);
  });

  it('rejects creating a form without a name', async () => {
    const formTypeId = await createFormType('Bug report');
    return authed('post', '/api/v1/forms').send({ formTypeId }).expect(400);
  });

  it('rejects creating a form with a form_type_id that does not exist', () => {
    return authed('post', '/api/v1/forms')
      .send({ formTypeId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', name: 'A form' })
      .expect(400);
  });

  it('covers the full lifecycle: create form type, create form, list/search, get, edit, delete', async () => {
    const formTypeId = await createFormType('Bug report');
    const uniqueName = `Login bug ${ulid()}`;

    const createResponse = await authed('post', '/api/v1/forms')
      .send({
        formTypeId,
        name: uniqueName,
        description: 'Bug report for the login flow',
      })
      .expect(201);

    const form = createResponse.body as {
      id: string;
      formTypeId: string;
      formTypeName: string;
      name: string;
    };
    expect(form).toMatchObject({
      formTypeId,
      formTypeName: 'Bug report',
      name: uniqueName,
      description: 'Bug report for the login flow',
    });
    const formId = form.id;

    const listResponse = await authed('get', '/api/v1/forms').expect(200);
    expect(
      (listResponse.body as { id: string }[]).map((item) => item.id),
    ).toContain(formId);

    const searchResponse = await authed(
      'get',
      `/api/v1/forms?name=${encodeURIComponent(uniqueName.toUpperCase())}`,
    ).expect(200);
    expect(
      (searchResponse.body as { id: string }[]).map((item) => item.id),
    ).toEqual([formId]);

    const noMatchResponse = await authed(
      'get',
      '/api/v1/forms?name=nonexistent',
    ).expect(200);
    expect(
      (noMatchResponse.body as { id: string }[]).some(
        (item) => item.id === formId,
      ),
    ).toBe(false);

    const getResponse = await authed('get', `/api/v1/forms/${formId}`).expect(
      200,
    );
    expect(getResponse.body).toMatchObject({ id: formId, name: uniqueName });

    const updateResponse = await authed('patch', `/api/v1/forms/${formId}`)
      .send({ name: `${uniqueName} (updated)` })
      .expect(200);
    expect(updateResponse.body).toMatchObject({
      name: `${uniqueName} (updated)`,
    });

    await authed('patch', `/api/v1/forms/${formId}`)
      .send({ name: '' })
      .expect(400);

    await authed('delete', `/api/v1/forms/${formId}`).expect(204);
    await authed('get', `/api/v1/forms/${formId}`).expect(404);

    const formTypeAfterDelete = await authed(
      'get',
      `/api/v1/form-types/${formTypeId}`,
    ).expect(200);
    expect(formTypeAfterDelete.body).toMatchObject({ id: formTypeId });
  });

  it('returns 404 for a non-existent form', () => {
    return authed('get', '/api/v1/forms/01ARZ3NDEKTSV4RRFFQ69G5FAV').expect(
      404,
    );
  });
});
