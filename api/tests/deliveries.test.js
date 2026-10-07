import request from 'supertest';
import { jest } from '@jest/globals';

// Creates a fake MongoDB insertOne function.
// This prevents automated tests from writing to the real Atlas database.
const mockInsertOne = jest.fn();
// US-05/US-06 follow-up: Fake MongoDB function for delivery status updates.
const mockFindOneAndUpdate = jest.fn();
// US-05/US-06 follow-up: Fake MongoDB lookup used to create a logged-in test courier.
const mockFindOne = jest.fn();
// US-05/US-06 follow-up: Fake MongoDB functions for retrieving a requester's deliveries.
const mockFind = jest.fn();
const mockSort = jest.fn();
const mockToArray = jest.fn();
// Mocks db.js before the application loads it.
jest.unstable_mockModule('../db.js', () => ({
    getDb: jest.fn(() => ({
        collection: jest.fn(() => ({
            insertOne: mockInsertOne,
            findOneAndUpdate: mockFindOneAndUpdate,
            findOne: mockFindOne,
            find: mockFind
        }))
    })),
    connectDb: jest.fn(),
    closeDb: jest.fn(),
    getClient: jest.fn()
}));

// Imports the DormDash application after the database mock is created.
const { createApp } = await import('../index.js');

const app = await createApp();

describe('POST /api/v1/deliveries/createDeliveryRequest', () => {
    // Resets the fake MongoDB function before every test.
    beforeEach(() => {
        mockInsertOne.mockReset();
        mockFindOneAndUpdate.mockReset();
        mockFindOne.mockReset();
        mockFind.mockReset();
        mockSort.mockReset();
        mockToArray.mockReset();
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
            .post('/api/v1/deliveries/createDeliveryRequest')
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
            .post('/api/v1/deliveries/createDeliveryRequest')
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
            .post('/api/v1/deliveries/createDeliveryRequest')
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
            .post('/api/v1/deliveries/createDeliveryRequest')
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
            .post('/api/v1/deliveries/createDeliveryRequest')
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
// US-05/US-06 follow-up: Tests the accepted-to-picked_up delivery transition.
describe('POST /api/v1/deliveries/pickUpDelivery', () => {

    beforeEach(() => {
        mockInsertOne.mockReset();
        mockFindOne.mockReset();
        mockFindOneAndUpdate.mockReset();
    });

    // US-05 follow-up: The assigned courier can mark an accepted delivery as picked up.
    it('allows the assigned courier to pick up an accepted delivery', async () => {
        const courierId = '507f1f77bcf86cd799439021';
        const deliveryId = '507f1f77bcf86cd799439022';

        // Signup: email does not already exist.
        mockFindOne.mockResolvedValueOnce(null);

        // Signup: MongoDB returns the courier's ID.
        mockInsertOne.mockResolvedValueOnce({
            insertedId: courierId
        });

        const agent = request.agent(app);

        const signup = await agent
            .post('/api/v1/auth/signup')
            .send({
                email: 'courier@school.edu',
                password: 'password123',
                firstName: 'Test',
                lastName: 'Courier'
            });

        expect(signup.status).toBe(201);

        // Pretend MongoDB finds the accepted delivery and changes it to picked_up.
        mockFindOneAndUpdate.mockResolvedValueOnce({
            _id: deliveryId,
            courierId,
            status: 'picked_up'
        });

        const res = await agent
            .post('/api/v1/deliveries/pickUpDelivery')
            .send({ deliveryId });

        expect(res.status).toBe(200);
        expect(res.body.statusMessage).toBe(
            'Delivery picked up successfully.'
        );
        expect(res.body.content.status).toBe('picked_up');

        // Verify that the backend only updates an accepted delivery
        // assigned to the logged-in courier.
        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: expect.anything(),
                status: 'accepted',
                courierId: expect.anything()
            },
            {
                $set: {
                    status: 'picked_up',
                    updatedAt: expect.any(Date)
                }
            },
            {
                returnDocument: 'after'
            }
        );
    });

    // US-05 follow-up: A delivery cannot be picked up when it is unavailable to this courier.
    it('rejects pickup when the delivery is not assigned and ready for this courier', async () => {
        const courierId = '507f1f77bcf86cd799439021';
        const deliveryId = '507f1f77bcf86cd799439022';

        // Signup: email does not already exist.
        mockFindOne.mockResolvedValueOnce(null);

        // Signup: MongoDB returns the courier's ID.
        mockInsertOne.mockResolvedValueOnce({
            insertedId: courierId
        });

        const agent = request.agent(app);

        const signup = await agent
            .post('/api/v1/auth/signup')
            .send({
                email: 'courier@school.edu',
                password: 'password123',
                firstName: 'Test',
                lastName: 'Courier'
            });

        expect(signup.status).toBe(201);

        // MongoDB finds no delivery matching:
        // this ID + accepted status + this assigned courier.
        mockFindOneAndUpdate.mockResolvedValueOnce(null);

        const res = await agent
            .post('/api/v1/deliveries/pickUpDelivery')
            .send({ deliveryId });

        expect(res.status).toBe(409);
        expect(res.body.statusMessage).toBe(
            'Delivery not found, not assigned to you, or not ready for pickup.'
        );
    });
});

// US-05/US-06 follow-up: Tests retrieving deliveries created by the logged-in requester.
describe('GET /api/v1/deliveries/myDeliveries', () => {

    beforeEach(() => {
        mockInsertOne.mockReset();
        mockFindOneAndUpdate.mockReset();
        mockFindOne.mockReset();
        mockFind.mockReset();
        mockSort.mockReset();
        mockToArray.mockReset();
    });

    // US-05 follow-up: A logged-in requester can retrieve their deliveries.
    it('returns the logged-in requester deliveries newest first', async () => {
        const requesterId = '507f1f77bcf86cd799439031';

        // Signup: email does not already exist.
        mockFindOne.mockResolvedValueOnce(null);

        // Signup: MongoDB returns the requester's ID.
        mockInsertOne.mockResolvedValueOnce({
            insertedId: requesterId
        });

        const agent = request.agent(app);

        const signup = await agent
            .post('/api/v1/auth/signup')
            .send({
                email: 'requester@school.edu',
                password: 'password123',
                firstName: 'Test',
                lastName: 'Requester'
            });

        expect(signup.status).toBe(201);

        const deliveries = [
            {
                _id: 'delivery-2',
                item: 'Coffee',
                status: 'accepted'
            },
            {
                _id: 'delivery-1',
                item: 'Book',
                status: 'delivered'
            }
        ];

        // Build the fake MongoDB chain:
        // find(...).sort(...).toArray()
        mockFind.mockReturnValue({
            sort: mockSort
        });

        mockSort.mockReturnValue({
            toArray: mockToArray
        });

        mockToArray.mockResolvedValue(deliveries);

        const res = await agent
            .get('/api/v1/deliveries/myDeliveries');

        expect(res.status).toBe(200);
        expect(res.body.statusMessage).toBe(
            'Deliveries retrieved successfully.'
        );

        expect(res.body.content).toEqual(deliveries);

        // Only retrieve deliveries created by the logged-in requester.
        expect(mockFind).toHaveBeenCalledWith({
            requesterId: expect.anything()
        });

        // Newest deliveries should appear first.
        expect(mockSort).toHaveBeenCalledWith({
            createdAt: -1
        });
    });
});
