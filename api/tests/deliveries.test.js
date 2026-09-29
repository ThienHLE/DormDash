import request from 'supertest';
import { createApp } from '../index.js';

const app = await createApp();

describe('POST /api/v1/deliveries', () => {

    // Tests that a valid delivery request is accepted.
    it('accepts a valid delivery request', async () => {
        const delivery = {
            item: 'Coffee',
            pickupLocation: 'Student Center',
            deliveryLocation: 'Library',
            tipAmount: 3
        };

        const res = await request(app)
            .post('/api/v1/deliveries')
            .send(delivery);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(delivery);
    });
});