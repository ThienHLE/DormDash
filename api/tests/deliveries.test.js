import request from 'supertest';
import { jest } from '@jest/globals';

// Creates a fake MongoDB insertOne function.
// This prevents automated tests from writing to the real Atlas database.
const mockInsertOne = jest.fn();

// Mocks db.js before the application loads it.
jest.unstable_mockModule('../db.js', () => ({
    getDb: jest.fn(() => ({
        collection: jest.fn(() => ({
            insertOne: mockInsertOne
        }))
    })),
    connectDb: jest.fn(),
    closeDb: jest.fn()
}));

// Imports the DormDash application after the database mock is created.
const { createApp } = await import('../index.js');

const app = await createApp();

describe('POST /api/v1/deliveries', () => {

    // Resets the fake MongoDB function before every test.
    beforeEach(() => {
        mockInsertOne.mockReset();
    });

    // Tests that a valid delivery request is created successfully.
    it('creates a valid delivery request', async () => {

        const delivery = {
            requesterId: '507f1f77bcf86cd799439011',
            item: 'Coffee',
            instructions: 'No sugar',
            pickupLocation: 'Student Center',
            deliveryLocation: 'Library',
            tip: 300
        };

        // Pretends MongoDB successfully inserted the delivery.
        mockInsertOne.mockResolvedValue({
            insertedId: 'test-delivery-id'
        });

        const res = await request(app)
            .post('/api/v1/deliveries')
            .send(delivery);

        // A new delivery resource should return 201 Created.
        expect(res.status).toBe(201);
        expect(res.body.statusCode).toBe(201);
        expect(res.body.statusMessage).toBe(
            'Delivery request created successfully.'
        );

        // Checks important values returned by the API.
        expect(res.body.content.requesterId).toBe(
            '507f1f77bcf86cd799439011'
        );
        expect(res.body.content._id).toBe('test-delivery-id');
        expect(res.body.content.item).toBe('Coffee');
        expect(res.body.content.instructions).toBe('No sugar');
        expect(res.body.content.pickupLocation).toBe('Student Center');
        expect(res.body.content.deliveryLocation).toBe('Library');
        expect(res.body.content.tip).toBe(300);
        expect(res.body.content.courierId).toBeNull();
        expect(res.body.content.status).toBe('open');

        // Verifies that MongoDB insertOne was called once.
        expect(mockInsertOne).toHaveBeenCalledTimes(1);
    });

    // Tests that a request with missing required information is rejected.
    it('rejects a delivery request with missing required fields', async () => {

        const delivery = {
            item: 'Coffee',
            instructions: 'No sugar',
            pickupLocation: 'Student Center',
            deliveryLocation: 'Library',
            tip: 300
        };

        const res = await request(app)
            .post('/api/v1/deliveries')
            .send(delivery);

        expect(res.status).toBe(400);
        expect(res.body.statusCode).toBe(400);
        expect(res.body.statusMessage).toBe(
            'Requester ID, item, pickup location, delivery location, and tip are required.'
        );
        expect(res.body.content).toEqual({});

        // Invalid data should never reach MongoDB.
        expect(mockInsertOne).not.toHaveBeenCalled();
    });

    // Tests that a negative tip is rejected.
    it('rejects a negative tip', async () => {

        const delivery = {
            requesterId: '507f1f77bcf86cd799439011',
            item: 'Coffee',
            instructions: 'No sugar',
            pickupLocation: 'Student Center',
            deliveryLocation: 'Library',
            tip: -5
        };

        const res = await request(app)
            .post('/api/v1/deliveries')
            .send(delivery);

        expect(res.status).toBe(400);
        expect(res.body.statusCode).toBe(400);
        expect(res.body.statusMessage).toBe(
            'Tip must be a non-negative integer in cents.'
        );
        expect(res.body.content).toEqual({});

        expect(mockInsertOne).not.toHaveBeenCalled();
    });

    // Tests the API response when MongoDB fails.
    it('returns 500 when the database insert fails', async () => {

        const delivery = {
            requesterId: '507f1f77bcf86cd799439011',
            item: 'Coffee',
            instructions: 'No sugar',
            pickupLocation: 'Student Center',
            deliveryLocation: 'Library',
            tip: 300
        };

        // Pretends that MongoDB failed.
        mockInsertOne.mockRejectedValue(
            new Error('Test database failure')
        );

        const res = await request(app)
            .post('/api/v1/deliveries')
            .send(delivery);

        expect(res.status).toBe(500);
        expect(res.body.statusCode).toBe(500);
        expect(res.body.statusMessage).toBe(
            'Failed to create delivery request.'
        );
        expect(res.body.content).toEqual({});
    });
    // Tests that an invalid requester ID is rejected.
    it('rejects an invalid requester ID', async () => {
        const delivery = {
            requesterId: 'invalid-id',
            item: 'Coffee',
            instructions: 'No sugar',
            pickupLocation: 'Student Center',
            deliveryLocation: 'Library',
            tip: 300
        };

        const res = await request(app)
            .post('/api/v1/deliveries')
            .send(delivery);

        expect(res.status).toBe(400);
        expect(res.body.statusCode).toBe(400);
        expect(res.body.statusMessage).toBe(
            'Requester ID must be a valid MongoDB ObjectId.'
        );
        expect(res.body.content).toEqual({});

        // Invalid requester ID should never reach MongoDB.
        expect(mockInsertOne).not.toHaveBeenCalled();
    });
});