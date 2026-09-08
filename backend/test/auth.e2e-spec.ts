import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { ulid } from 'ulid';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/modules/users/users.service';

describe('Auth, users, and invites (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let usersService: UsersService;

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

    prisma = moduleFixture.get(PrismaService);
    usersService = moduleFixture.get(UsersService);
  });

  afterEach(async () => {
    await app.close();
  });

  function uniqueEmail(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  }

  async function createUser(role: Role, password = 'a-good-password') {
    const email = uniqueEmail(role);
    const passwordHash = await usersService.hashPassword(password);
    await prisma.user.create({
      data: { id: ulid(), email, name: 'Test User', passwordHash, role },
    });
    return { email, password };
  }

  async function loginAs(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return (response.body as { accessToken: string }).accessToken;
  }

  it('rejects a protected route without a session token', () => {
    return request(app.getHttpServer()).get('/api/v1/health').expect(401);
  });

  describe('login', () => {
    it('rejects an unknown email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'anything' })
        .expect(401);
    });

    it('rejects the wrong password', async () => {
      const { email } = await createUser(Role.member, 'correct-password');

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrong-password' })
        .expect(401);
    });

    it('logs in and then reaches a protected route with the returned token', async () => {
      const { email, password } = await createUser(
        Role.member,
        'correct-password',
      );

      const accessToken = await loginAs(email, password);
      expect(accessToken).toEqual(expect.any(String));

      return request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect({ status: 'ok' });
    });
  });

  describe('users/me', () => {
    it("returns the caller's own profile, including role", async () => {
      const admin = await createUser(Role.admin);
      const adminToken = await loginAs(admin.email, admin.password);

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: admin.email,
        role: Role.admin,
      });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('reflects a member role for a member account', async () => {
      const member = await createUser(Role.member);
      const memberToken = await loginAs(member.email, member.password);

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: member.email,
        role: Role.member,
      });
    });
  });

  describe('invites', () => {
    it('lets an admin create an invite', async () => {
      const admin = await createUser(Role.admin);
      const adminToken = await loginAs(admin.email, admin.password);
      const targetEmail = uniqueEmail('invitee');

      const response = await request(app.getHttpServer())
        .post('/api/v1/invites')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: targetEmail, role: Role.member })
        .expect(201);

      expect(response.body).toMatchObject({
        email: targetEmail,
        role: Role.member,
      });
      expect((response.body as { token: string }).token).toEqual(
        expect.any(String),
      );
    });

    it('rejects invite creation from a non-admin', async () => {
      const member = await createUser(Role.member);
      const memberToken = await loginAs(member.email, member.password);

      return request(app.getHttpServer())
        .post('/api/v1/invites')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ email: uniqueEmail('invitee'), role: Role.member })
        .expect(403);
    });

    it('lets an admin invite another admin', async () => {
      const admin = await createUser(Role.admin);
      const adminToken = await loginAs(admin.email, admin.password);
      const targetEmail = uniqueEmail('invited-admin');

      const inviteResponse = await request(app.getHttpServer())
        .post('/api/v1/invites')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: targetEmail, role: Role.admin })
        .expect(201);
      const { token } = inviteResponse.body as { token: string };

      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          token,
          email: targetEmail,
          password: 'a-good-password',
          name: 'New Admin',
        })
        .expect(200);
      const { accessToken } = registerResponse.body as {
        accessToken: string;
      };

      const newAdminToken = accessToken;
      return request(app.getHttpServer())
        .post('/api/v1/invites')
        .set('Authorization', `Bearer ${newAdminToken}`)
        .send({ email: uniqueEmail('another-invitee'), role: Role.member })
        .expect(201);
    });
  });

  describe('registration', () => {
    async function createInvite(email: string, role: Role = Role.member) {
      const admin = await createUser(Role.admin);
      const adminToken = await loginAs(admin.email, admin.password);
      const response = await request(app.getHttpServer())
        .post('/api/v1/invites')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email, role })
        .expect(201);
      return response.body as { id: string; token: string };
    }

    it('registers a new account with a valid invite and logs it in', async () => {
      const email = uniqueEmail('invitee');
      const { token } = await createInvite(email);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ token, email, password: 'a-good-password', name: 'Invitee' })
        .expect(200);

      const { accessToken } = response.body as { accessToken: string };
      expect(accessToken).toEqual(expect.any(String));

      return request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('rejects an unknown token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          token: 'not-a-real-token',
          email: uniqueEmail('invitee'),
          password: 'a-good-password',
          name: 'Invitee',
        })
        .expect(400);
    });

    it('rejects a token that has already been used', async () => {
      const email = uniqueEmail('invitee');
      const { token } = await createInvite(email);
      const body = {
        token,
        email,
        password: 'a-good-password',
        name: 'Invitee',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(body)
        .expect(200);

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(body)
        .expect(400);
    });

    it('rejects an expired invite', async () => {
      const email = uniqueEmail('invitee');
      const { id, token } = await createInvite(email);
      await prisma.invite.update({
        where: { id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ token, email, password: 'a-good-password', name: 'Invitee' })
        .expect(400);
    });

    it('rejects an email that does not match the invite', async () => {
      const email = uniqueEmail('invitee');
      const { token } = await createInvite(email);

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          token,
          email: uniqueEmail('someone-else'),
          password: 'a-good-password',
          name: 'Invitee',
        })
        .expect(400);
    });
  });
});
