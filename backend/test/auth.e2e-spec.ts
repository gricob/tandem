import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.APP_PASSWORD = 'correct-password';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('rejects a protected route without a session token', () => {
    return request(app.getHttpServer()).get('/api/v1/health').expect(401);
  });

  it('rejects login with the wrong password', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ password: 'wrong-password' })
      .expect(401);
  });

  it('logs in and then reaches a protected route with the returned token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ password: 'correct-password' })
      .expect(200);

    const { accessToken } = loginResponse.body as { accessToken: string };
    expect(accessToken).toEqual(expect.any(String));

    return request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({ status: 'ok' });
  });

  afterEach(async () => {
    await app.close();
  });
});
