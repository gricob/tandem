import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('FormTemplates (e2e)', () => {
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

  it('rejects requests without a session token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/form-templates')
      .expect(401);
  });

  it('rejects creating a form template without a name', () => {
    return authed('post', '/api/v1/form-templates').send({}).expect(400);
  });

  it('covers the full lifecycle: create form template, add fields, reorder, edit, delete field, delete form template', async () => {
    const createResponse = await authed('post', '/api/v1/form-templates')
      .send({ name: 'Bug report', description: 'Info needed to triage a bug' })
      .expect(201);

    const formTemplateId = (createResponse.body as { id: string }).id;
    expect(createResponse.body).toMatchObject({
      name: 'Bug report',
      description: 'Info needed to triage a bug',
      templateFields: [],
    });

    await authed('post', `/api/v1/form-templates/${formTemplateId}/fields`)
      .send({ label: 'Broken', fieldType: 'select' })
      .expect(400);

    await authed('post', `/api/v1/form-templates/${formTemplateId}/fields`)
      .send({ label: 'Broken', fieldType: 'text', options: ['a'] })
      .expect(400);

    const field1Response = await authed(
      'post',
      `/api/v1/form-templates/${formTemplateId}/fields`,
    )
      .send({
        label: 'Severity',
        fieldType: 'select',
        options: ['low', 'medium', 'high'],
        isRequired: true,
      })
      .expect(201);
    const field1Id = (field1Response.body as { id: string; orderIndex: number })
      .id;
    expect(field1Response.body).toMatchObject({ orderIndex: 0 });

    const field2Response = await authed(
      'post',
      `/api/v1/form-templates/${formTemplateId}/fields`,
    )
      .send({ label: 'Description', fieldType: 'textarea', isRequired: true })
      .expect(201);
    const field2Id = (field2Response.body as { id: string }).id;
    expect(field2Response.body).toMatchObject({ orderIndex: 1 });

    const getResponse = await authed(
      'get',
      `/api/v1/form-templates/${formTemplateId}`,
    ).expect(200);
    expect(
      (
        getResponse.body as { templateFields: { id: string }[] }
      ).templateFields.map((field) => field.id),
    ).toEqual([field1Id, field2Id]);

    await authed('put', `/api/v1/form-templates/${formTemplateId}/fields/order`)
      .send({ fieldIds: [field1Id] })
      .expect(400);

    const reorderResponse = await authed(
      'put',
      `/api/v1/form-templates/${formTemplateId}/fields/order`,
    )
      .send({ fieldIds: [field2Id, field1Id] })
      .expect(200);
    expect(
      (
        reorderResponse.body as { templateFields: { id: string }[] }
      ).templateFields.map((field) => field.id),
    ).toEqual([field2Id, field1Id]);

    const updateFieldResponse = await authed(
      'patch',
      `/api/v1/form-templates/${formTemplateId}/fields/${field1Id}`,
    )
      .send({ label: 'Severity level' })
      .expect(200);
    expect(updateFieldResponse.body).toMatchObject({ label: 'Severity level' });

    await authed(
      'delete',
      `/api/v1/form-templates/${formTemplateId}/fields/${field1Id}`,
    ).expect(204);

    const afterFieldDelete = await authed(
      'get',
      `/api/v1/form-templates/${formTemplateId}`,
    ).expect(200);
    expect(
      (afterFieldDelete.body as { templateFields: { id: string }[] })
        .templateFields,
    ).toHaveLength(1);

    await authed('delete', `/api/v1/form-templates/${formTemplateId}`).expect(
      204,
    );

    await authed('get', `/api/v1/form-templates/${formTemplateId}`).expect(404);
  });

  it('returns 404 for a non-existent form template', () => {
    return authed(
      'get',
      '/api/v1/form-templates/01ARZ3NDEKTSV4RRFFQ69G5FAV',
    ).expect(404);
  });

  it('deleting a form template orphans (does not delete) the forms created from it', async () => {
    const createTemplateResponse = await authed(
      'post',
      '/api/v1/form-templates',
    )
      .send({ name: 'Bug report' })
      .expect(201);
    const formTemplateId = (createTemplateResponse.body as { id: string }).id;

    await authed('post', `/api/v1/form-templates/${formTemplateId}/fields`)
      .send({ label: 'Notes', fieldType: 'text' })
      .expect(201);

    const createFormResponse = await authed('post', '/api/v1/forms')
      .send({ formTemplateId, name: 'Bug #1' })
      .expect(201);
    const formId = (createFormResponse.body as { id: string }).id;
    const clonedFieldId = (
      createFormResponse.body as { fields: { id: string }[] }
    ).fields[0].id;

    await authed('delete', `/api/v1/form-templates/${formTemplateId}`).expect(
      204,
    );

    const formAfterDelete = await authed('get', `/api/v1/forms/${formId}`)
      .expect(200)
      .then(
        (res) =>
          res.body as {
            formTemplateId: string | null;
            formTemplateName: string | null;
            fields: { id: string }[];
          },
      );

    expect(formAfterDelete.formTemplateId).toBeNull();
    expect(formAfterDelete.formTemplateName).toBeNull();
    expect(formAfterDelete.fields).toEqual([
      expect.objectContaining({ id: clonedFieldId }),
    ]);
  });
});
