import request from 'supertest';
import { createApp } from '../index.js';

const app = await createApp();

describe('GET /', () => {
    it('returns the welcome message', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toBe('Welcome to DormDash API');
    });
});

describe('GET /api/v1/ping', () => {
    it('returns Pong!', async () => {
        const res = await request(app).get('/api/v1/ping');
        expect(res.status).toBe(200);
        expect(res.body.content.message).toBe('pong!');
    });
});