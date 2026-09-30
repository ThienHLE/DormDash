import { jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

let users = [];

const sameId = (a, b) => String(a) === String(b);
const matches = (doc, filter = {}) => Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === 'object' && '$ne' in value) {
        return key === '_id' ? !sameId(doc._id, value.$ne) : doc[key] !== value.$ne;
    }
    return key === '_id' ? sameId(doc._id, value) : doc[key] === value;
});
const project = (doc, projection) => {
    if (!doc) return null;
    const copy = { ...doc };
    if (projection?.passwordHash === 0) delete copy.passwordHash;
    return copy;
};

const fakeDb = {
    collection: () => ({
        findOne: async (filter, opts) => project(users.find((u) => matches(u, filter)), opts?.projection),
        find: (filter, opts) => ({
            toArray: async () => users.filter((u) => matches(u, filter)).map((u) => project(u, opts?.projection))
        }),
        insertOne: async (doc) => {
            const _id = new ObjectId();
            users.push({ ...doc, _id });
            return { insertedId: _id };
        },
        findOneAndUpdate: async (filter, update, opts) => {
            const doc = users.find((u) => matches(u, filter));
            if (!doc) return null;
            Object.assign(doc, update.$set);
            return project(doc, opts?.projection);
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
const missingId = new ObjectId().toString();

// Signs up a user and returns an agent that is logged in as them.
async function loggedInAgent(overrides = {}) {
    const agent = request.agent(app);
    const res = await agent.post('/api/v1/auth/signup').send({ ...newUser, ...overrides });
    expect(res.status).toBe(201);
    return { agent, id: res.body.content.user._id };
}

// Inserts an admin directly (signup cannot create one) and returns a logged-in agent.
async function adminAgent() {
    users.push({
        _id: new ObjectId(),
        email: 'admin@school.edu',
        passwordHash: await bcrypt.hash('adminpass123', 4),
        firstName: 'Ad',
        lastName: 'Min',
        admin: true,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    const agent = request.agent(app);
    const res = await agent.post('/api/v1/auth/login').send({ email: 'admin@school.edu', password: 'adminpass123' });
    expect(res.status).toBe(200);
    return agent;
}

describe('auth', () => {
    describe('POST /signup', () => {
        it('signs up, stays logged in, logs out', async () => {
            const agent = request.agent(app);

            const signup = await agent.post('/api/v1/auth/signup')
                .send({ ...newUser, email: 'test@school.edu', admin: true });
            expect(signup.status).toBe(201);
            expect(signup.body.content.user._id).toBe(users[0]._id.toString());
            expect(signup.body.content.user.passwordHash).toBeUndefined();
            expect(users[0].passwordHash).not.toContain('password123');
            expect(users[0]).toMatchObject({ firstName: 'Test', lastName: 'User', admin: false, verified: false });
            expect(users[0].createdAt).toBeInstanceOf(Date);
            expect(users[0].updatedAt).toEqual(users[0].createdAt);

            const me = await agent.get('/api/v1/auth/me');
            expect(me.status).toBe(200);
            expect(me.body.content.user).toMatchObject({
                _id: users[0]._id.toString(),
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

        it('rejects duplicate emails', async () => {
            await request(app).post('/api/v1/auth/signup').send(newUser);
            const res = await request(app).post('/api/v1/auth/signup').send(newUser);
            expect(res.status).toBe(409);
            expect(users).toHaveLength(1);
        });

        it.each(['email', 'password', 'firstName', 'lastName'])('rejects signup missing %s', async (field) => {
            const body = { ...newUser };
            delete body[field];
            const res = await request(app).post('/api/v1/auth/signup').send(body);
            expect(res.status).toBe(400);
            expect(users).toHaveLength(0);
        });

        it('rejects signup with no body', async () => {
            const res = await request(app).post('/api/v1/auth/signup');
            expect(res.status).toBe(400);
        });
    });

    describe('POST /login', () => {
        it('logs in with correct credentials only', async () => {
            await request(app).post('/api/v1/auth/signup').send(newUser);

            const bad = await request(app).post('/api/v1/auth/login')
                .send({ email: 'a@school.edu', password: 'wrongpassword' });
            expect(bad.status).toBe(401);

            const agent = request.agent(app);
            const good = await agent.post('/api/v1/auth/login')
                .send({ email: 'a@school.edu', password: 'password123' });
            expect(good.status).toBe(200);
            expect(good.body.content.user.email).toBe('a@school.edu');
            expect(good.body.content.user.passwordHash).toBeUndefined();
            expect((await agent.get('/api/v1/auth/me')).status).toBe(200);
        });

        it('rejects unknown email', async () => {
            const res = await request(app).post('/api/v1/auth/login')
                .send({ email: 'nobody@school.edu', password: 'password123' });
            expect(res.status).toBe(401);
        });

        it('rejects missing password', async () => {
            await request(app).post('/api/v1/auth/signup').send(newUser);
            const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@school.edu' });
            expect(res.status).toBe(401);
        });

        it('rejects empty body', async () => {
            const res = await request(app).post('/api/v1/auth/login');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /logout and GET /me', () => {
        it('/me requires login', async () => {
            const res = await request(app).get('/api/v1/auth/me');
            expect(res.status).toBe(401);
        });

        it('logout succeeds even when not logged in', async () => {
            const res = await request(app).post('/api/v1/auth/logout');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /user/:id', () => {
        it('requires login', async () => {
            const res = await request(app).get(`/api/v1/auth/user/${missingId}`);
            expect(res.status).toBe(401);
        });

        it('returns a user without the password hash', async () => {
            const { agent, id } = await loggedInAgent();
            const res = await agent.get(`/api/v1/auth/user/${id}`);
            expect(res.status).toBe(200);
            expect(res.body.content.user).toMatchObject({ _id: id, email: 'a@school.edu', firstName: 'Test' });
            expect(res.body.content.user.passwordHash).toBeUndefined();
        });

        it('rejects an invalid id', async () => {
            const { agent } = await loggedInAgent();
            const res = await agent.get('/api/v1/auth/user/not-an-id');
            expect(res.status).toBe(400);
        });

        it('returns 404 for an unknown user', async () => {
            const { agent } = await loggedInAgent();
            const res = await agent.get(`/api/v1/auth/user/${missingId}`);
            expect(res.status).toBe(404);
        });
    });

    describe('GET /getUsers', () => {
        it('requires login', async () => {
            const res = await request(app).get('/api/v1/auth/getUsers');
            expect(res.status).toBe(401);
        });

        it('lists all users without password hashes', async () => {
            const { agent } = await loggedInAgent();
            await request(app).post('/api/v1/auth/signup').send({ ...newUser, email: 'b@school.edu' });

            const res = await agent.get('/api/v1/auth/getUsers');
            expect(res.status).toBe(200);
            expect(res.body.content.users.map((u) => u.email)).toEqual(['a@school.edu', 'b@school.edu']);
            res.body.content.users.forEach((u) => expect(u.passwordHash).toBeUndefined());
        });
    });

    describe('PATCH /update', () => {
        it('requires login', async () => {
            const res = await request(app).patch('/api/v1/auth/update').send({ firstName: 'New' });
            expect(res.status).toBe(401);
        });

        it('updates profile fields and refreshes the session', async () => {
            const { agent, id } = await loggedInAgent();
            const before = users[0].updatedAt;
            await new Promise((resolve) => setTimeout(resolve, 5));

            const res = await agent.patch('/api/v1/auth/update')
                .send({ firstName: 'New', lastName: 'Name', email: 'new@school.edu' });
            expect(res.status).toBe(200);
            expect(res.body.content.user).toMatchObject({ _id: id, firstName: 'New', lastName: 'Name', email: 'new@school.edu' });
            expect(res.body.content.user.passwordHash).toBeUndefined();
            expect(users[0]).toMatchObject({ firstName: 'New', lastName: 'Name', email: 'new@school.edu' });
            expect(users[0].updatedAt.getTime()).toBeGreaterThan(before.getTime());

            const me = await agent.get('/api/v1/auth/me');
            expect(me.body.content.user).toMatchObject({ firstName: 'New', email: 'new@school.edu' });
        });

        it('changes the password', async () => {
            const { agent } = await loggedInAgent();
            const res = await agent.patch('/api/v1/auth/update').send({ password: 'newpassword456' });
            expect(res.status).toBe(200);
            expect(res.body.content.user.passwordHash).toBeUndefined();

            const oldLogin = await request(app).post('/api/v1/auth/login')
                .send({ email: 'a@school.edu', password: 'password123' });
            expect(oldLogin.status).toBe(401);
            const newLogin = await request(app).post('/api/v1/auth/login')
                .send({ email: 'a@school.edu', password: 'newpassword456' });
            expect(newLogin.status).toBe(200);
        });

        it('allows re-submitting your own email', async () => {
            const { agent } = await loggedInAgent();
            const res = await agent.patch('/api/v1/auth/update').send({ email: 'a@school.edu' });
            expect(res.status).toBe(200);
        });

        it('rejects an email used by another user', async () => {
            await request(app).post('/api/v1/auth/signup').send({ ...newUser, email: 'b@school.edu' });
            const { agent } = await loggedInAgent();
            const res = await agent.patch('/api/v1/auth/update').send({ email: 'b@school.edu' });
            expect(res.status).toBe(409);
        });

        it('rejects empty or null fields', async () => {
            const { agent } = await loggedInAgent();
            expect((await agent.patch('/api/v1/auth/update').send({ firstName: '' })).status).toBe(400);
            expect((await agent.patch('/api/v1/auth/update').send({ lastName: null })).status).toBe(400);
            expect(users[0].firstName).toBe('Test');
        });

        it('rejects a body with no updatable fields', async () => {
            const { agent } = await loggedInAgent();
            expect((await agent.patch('/api/v1/auth/update').send({})).status).toBe(400);
            expect((await agent.patch('/api/v1/auth/update').send({ admin: true })).status).toBe(400);
            expect(users[0].admin).toBe(false);
        });

        it('returns 404 if the session user no longer exists', async () => {
            const { agent } = await loggedInAgent();
            users = [];
            const res = await agent.patch('/api/v1/auth/update').send({ firstName: 'New' });
            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /verifyUser/:id', () => {
        it('requires login', async () => {
            const res = await request(app).patch(`/api/v1/auth/verifyUser/${missingId}`);
            expect(res.status).toBe(401);
        });

        it('forbids non-admins', async () => {
            const { agent, id } = await loggedInAgent();
            const res = await agent.patch(`/api/v1/auth/verifyUser/${id}`);
            expect(res.status).toBe(403);
            expect(users[0].verified).toBe(false);
        });

        it('lets an admin verify a user', async () => {
            const { id } = await loggedInAgent();
            const admin = await adminAgent();

            const res = await admin.patch(`/api/v1/auth/verifyUser/${id}`);
            expect(res.status).toBe(200);
            expect(res.body.content.user).toMatchObject({ _id: id, verified: true });
            expect(res.body.content.user.passwordHash).toBeUndefined();
            expect(users.find((u) => sameId(u._id, id)).verified).toBe(true);
        });

        it('rejects an invalid id', async () => {
            const admin = await adminAgent();
            const res = await admin.patch('/api/v1/auth/verifyUser/not-an-id');
            expect(res.status).toBe(400);
        });

        it('returns 404 for an unknown user', async () => {
            const admin = await adminAgent();
            const res = await admin.patch(`/api/v1/auth/verifyUser/${missingId}`);
            expect(res.status).toBe(404);
        });
    });
});
