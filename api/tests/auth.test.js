import { jest } from '@jest/globals';
import request from 'supertest';

let users = [];
const fakeDb = {
    collection: () => ({
        findOne: async ({ email }) => users.find((u) => u.email === email) ?? null,
        insertOne: async (doc) => {
            const _id = `user${users.length + 1}`;
            users.push({ ...doc, _id });
            return { insertedId: _id };
        }
    })
};

jest.unstable_mockModule('../db.js', () => ({
    getDb: () => fakeDb,
    getClient: () => undefined,
    connectDb: async () => {},
    closeDb: async () => {}
}));

const { createApp } = await import('../index.js');
const app = await createApp();

beforeEach(() => {
    users = [];
});

const newUser = { email: 'a@school.edu', password: 'password123', firstName: 'Test', lastName: 'User' };

describe('auth', () => {
    it('signs up, stays logged in, logs out', async () => {
        const agent = request.agent(app);

        const signup = await agent.post('/api/v1/auth/signup')
            .send({ ...newUser, email: 'test@school.edu', admin: true });
        expect(signup.status).toBe(201);
        expect(signup.body.content.user._id).toBe(users[0]._id);
        expect(signup.body.content.user.passwordHash).toBeUndefined();
        expect(users[0].passwordHash).not.toContain('password123');
        expect(users[0]).toMatchObject({ firstName: 'Test', lastName: 'User', admin: false, verified: false });
        expect(users[0].createdAt).toBeInstanceOf(Date);
        expect(users[0].updatedAt).toEqual(users[0].createdAt);

        const me = await agent.get('/api/v1/auth/me');
        expect(me.status).toBe(200);
        expect(me.body.content.user).toMatchObject({
            _id: users[0]._id,
            email: 'test@school.edu',
            firstName: 'Test',
            lastName: 'User',
            admin: false,
            verified: false,
            createdAt: users[0].createdAt.toISOString(),
            updatedAt: users[0].updatedAt.toISOString()
        });
        expect(me.body.content.user.passwordHash).toBeUndefined();

        expect((await agent.post('/api/v1/auth/logout')).status).toBe(200);
        expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
    });

    it('logs in with correct credentials only', async () => {
        await request(app).post('/api/v1/auth/signup').send(newUser);

        const bad = await request(app).post('/api/v1/auth/login')
            .send({ email: 'a@school.edu', password: 'wrongpassword' });
        expect(bad.status).toBe(401);

        const agent = request.agent(app);
        const good = await agent.post('/api/v1/auth/login')
            .send({ email: 'a@school.edu', password: 'password123' });
        expect(good.status).toBe(200);
        expect((await agent.get('/api/v1/auth/me')).status).toBe(200);
    });

    it('rejects duplicate emails', async () => {
        await request(app).post('/api/v1/auth/signup').send(newUser);
        const res = await request(app).post('/api/v1/auth/signup').send(newUser);
        expect(res.status).toBe(409);
    });

    it('rejects signup with missing fields', async () => {
        const res = await request(app).post('/api/v1/auth/signup')
            .send({ email: 'a@school.edu', password: 'password123', firstName: 'Test' });
        expect(res.status).toBe(400);
    });
});
