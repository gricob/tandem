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

  async function createFormTemplate(name: string) {
    const response = await authed('post', '/api/v1/form-templates')
      .send({ name })
      .expect(201);
    return (response.body as { id: string }).id;
  }

  it('rejects requests without a session token', () => {
    return request(app.getHttpServer()).get('/api/v1/forms').expect(401);
  });

  it('rejects creating a form without a name', async () => {
    const formTemplateId = await createFormTemplate('Bug report');
    return authed('post', '/api/v1/forms').send({ formTemplateId }).expect(400);
  });

  it('rejects creating a form with a form_template_id that does not exist', () => {
    return authed('post', '/api/v1/forms')
      .send({
        formTemplateId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        name: 'A form',
      })
      .expect(400);
  });

  it('covers the full lifecycle: create form template, create form, list/search, get, edit, delete', async () => {
    const formTemplateId = await createFormTemplate('Bug report');
    const uniqueName = `Login bug ${ulid()}`;

    const createResponse = await authed('post', '/api/v1/forms')
      .send({
        formTemplateId,
        name: uniqueName,
        description: 'Bug report for the login flow',
      })
      .expect(201);

    const form = createResponse.body as {
      id: string;
      formTemplateId: string;
      formTemplateName: string;
      name: string;
    };
    expect(form).toMatchObject({
      formTemplateId,
      formTemplateName: 'Bug report',
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

    const formTemplateAfterDelete = await authed(
      'get',
      `/api/v1/form-templates/${formTemplateId}`,
    ).expect(200);
    expect(formTemplateAfterDelete.body).toMatchObject({ id: formTemplateId });
  });

  it('returns 404 for a non-existent form', () => {
    return authed('get', '/api/v1/forms/01ARZ3NDEKTSV4RRFFQ69G5FAV').expect(
      404,
    );
  });

  it("clones the template's fields onto the form at creation, independent of the template afterwards", async () => {
    const formTemplateId = await createFormTemplate('Bug report');
    const fieldResponse = await authed(
      'post',
      `/api/v1/form-templates/${formTemplateId}/fields`,
    )
      .send({ label: 'Severity', fieldType: 'text', isRequired: true })
      .expect(201);
    const templateFieldId = (fieldResponse.body as { id: string }).id;

    const createResponse = await authed('post', '/api/v1/forms')
      .send({ formTemplateId, name: 'Bug #1' })
      .expect(201);
    const form = createResponse.body as {
      id: string;
      fields: { id: string; label: string; isRequired: boolean }[];
    };
    expect(form.fields).toHaveLength(1);
    const clonedFieldId = form.fields[0].id;
    expect(clonedFieldId).not.toBe(templateFieldId);
    expect(form.fields[0]).toMatchObject({
      label: 'Severity',
      isRequired: true,
    });

    await authed(
      'patch',
      `/api/v1/form-templates/${formTemplateId}/fields/${templateFieldId}`,
    )
      .send({ label: 'Severity (changed)' })
      .expect(200);

    const formAfterTemplateEdit = await authed(
      'get',
      `/api/v1/forms/${form.id}`,
    ).expect(200);
    expect(
      (formAfterTemplateEdit.body as { fields: { label: string }[] }).fields[0],
    ).toMatchObject({ label: 'Severity' });
  });
});
