import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('FormResponses (e2e)', () => {
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

  async function createFormTypeWithFields(): Promise<{
    formTypeId: string;
    nameFieldId: string;
    severityFieldId: string;
  }> {
    const formTypeResponse = await authed('post', '/api/v1/form-types')
      .send({ name: 'Bug report' })
      .expect(201);
    const formTypeId = (formTypeResponse.body as { id: string }).id;

    const nameFieldResponse = await authed(
      'post',
      `/api/v1/form-types/${formTypeId}/fields`,
    )
      .send({ label: 'Name', fieldType: 'text', isRequired: true })
      .expect(201);
    const nameFieldId = (nameFieldResponse.body as { id: string }).id;

    const severityFieldResponse = await authed(
      'post',
      `/api/v1/form-types/${formTypeId}/fields`,
    )
      .send({
        label: 'Severity',
        fieldType: 'select',
        isRequired: false,
        options: ['Low', 'High'],
      })
      .expect(201);
    const severityFieldId = (severityFieldResponse.body as { id: string }).id;

    return { formTypeId, nameFieldId, severityFieldId };
  }

  async function createForm(formTypeId: string): Promise<string> {
    const response = await authed('post', '/api/v1/forms')
      .send({ formTypeId, name: 'Login bug' })
      .expect(201);
    return (response.body as { id: string }).id;
  }

  it('rejects requests without a session token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/forms/01ARZ3NDEKTSV4RRFFQ69G5FAV/response')
      .expect(401);
  });

  it('returns 404 saving a response for a non-existent form', () => {
    return authed('put', '/api/v1/forms/01ARZ3NDEKTSV4RRFFQ69G5FAV/response')
      .send({ responseData: {} })
      .expect(404);
  });

  it('returns 404 getting a response before any form exists', () => {
    return authed(
      'get',
      '/api/v1/forms/01ARZ3NDEKTSV4RRFFQ69G5FAV/response',
    ).expect(404);
  });

  it('rejects a response value for an unknown field id', async () => {
    const { formTypeId } = await createFormTypeWithFields();
    const formId = await createForm(formTypeId);

    return authed('put', `/api/v1/forms/${formId}/response`)
      .send({ responseData: { 'unknown-field': 'value' } })
      .expect(400);
  });

  it('rejects a response value whose shape does not match the field type', async () => {
    const { formTypeId, severityFieldId } = await createFormTypeWithFields();
    const formId = await createForm(formTypeId);

    return authed('put', `/api/v1/forms/${formId}/response`)
      .send({ responseData: { [severityFieldId]: 'Critical' } })
      .expect(400);
  });

  it('returns 404 getting a response for a form with none saved yet', async () => {
    const { formTypeId } = await createFormTypeWithFields();
    const formId = await createForm(formTypeId);

    return authed('get', `/api/v1/forms/${formId}/response`).expect(404);
  });

  it('covers the incremental save flow: partial save, complete it, clear a field', async () => {
    const { formTypeId, nameFieldId, severityFieldId } =
      await createFormTypeWithFields();
    const formId = await createForm(formTypeId);

    const partialSave = await authed('put', `/api/v1/forms/${formId}/response`)
      .send({ responseData: { [severityFieldId]: 'Low' } })
      .expect(200);
    expect(partialSave.body).toMatchObject({
      formId,
      responseData: { [severityFieldId]: 'Low' },
      isComplete: false,
    });

    const partialGet = await authed(
      'get',
      `/api/v1/forms/${formId}/response`,
    ).expect(200);
    expect(partialGet.body).toMatchObject({
      responseData: { [severityFieldId]: 'Low' },
      isComplete: false,
    });

    const completeSave = await authed('put', `/api/v1/forms/${formId}/response`)
      .send({ responseData: { [nameFieldId]: 'Alice' } })
      .expect(200);
    expect(completeSave.body).toMatchObject({
      responseData: { [nameFieldId]: 'Alice', [severityFieldId]: 'Low' },
      isComplete: true,
    });

    const clearSave = await authed('put', `/api/v1/forms/${formId}/response`)
      .send({ responseData: { [severityFieldId]: null } })
      .expect(200);
    const clearedResponseData = (
      clearSave.body as { responseData: Record<string, unknown> }
    ).responseData;
    expect(clearedResponseData).toEqual({ [nameFieldId]: 'Alice' });

    const finalGet = await authed(
      'get',
      `/api/v1/forms/${formId}/response`,
    ).expect(200);
    expect(finalGet.body).toMatchObject({
      responseData: { [nameFieldId]: 'Alice' },
      isComplete: true,
    });
  });
});
