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

  async function createFormTemplateWithFields(): Promise<string> {
    const formTemplateResponse = await authed('post', '/api/v1/form-templates')
      .send({ name: 'Bug report' })
      .expect(201);
    const formTemplateId = (formTemplateResponse.body as { id: string }).id;

    await authed('post', `/api/v1/form-templates/${formTemplateId}/fields`)
      .send({ label: 'Name', fieldType: 'text', isRequired: true })
      .expect(201);

    await authed('post', `/api/v1/form-templates/${formTemplateId}/fields`)
      .send({
        label: 'Severity',
        fieldType: 'select',
        isRequired: false,
        options: ['Low', 'High'],
      })
      .expect(201);

    return formTemplateId;
  }

  async function createForm(formTemplateId: string): Promise<{
    formId: string;
    nameFieldId: string;
    severityFieldId: string;
  }> {
    const response = await authed('post', '/api/v1/forms')
      .send({ formTemplateId, name: 'Login bug' })
      .expect(201);
    const body = response.body as {
      id: string;
      fields: { id: string; label: string }[];
    };
    const nameFieldId = body.fields.find((f) => f.label === 'Name')!.id;
    const severityFieldId = body.fields.find((f) => f.label === 'Severity')!.id;
    return { formId: body.id, nameFieldId, severityFieldId };
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
    const formTemplateId = await createFormTemplateWithFields();
    const { formId } = await createForm(formTemplateId);

    return authed('put', `/api/v1/forms/${formId}/response`)
      .send({ responseData: { 'unknown-field': 'value' } })
      .expect(400);
  });

  it('rejects a response value whose shape does not match the field type', async () => {
    const formTemplateId = await createFormTemplateWithFields();
    const { formId, severityFieldId } = await createForm(formTemplateId);

    return authed('put', `/api/v1/forms/${formId}/response`)
      .send({ responseData: { [severityFieldId]: 'Critical' } })
      .expect(400);
  });

  it('returns 404 getting a response for a form with none saved yet', async () => {
    const formTemplateId = await createFormTemplateWithFields();
    const { formId } = await createForm(formTemplateId);

    return authed('get', `/api/v1/forms/${formId}/response`).expect(404);
  });

  it('covers the incremental save flow: partial save, complete it, clear a field', async () => {
    const formTemplateId = await createFormTemplateWithFields();
    const { formId, nameFieldId, severityFieldId } =
      await createForm(formTemplateId);

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
