import request from 'supertest';
import { jest } from '@jest/globals';
import { ObjectId } from 'mongodb';

// US-05/US-06 follow-up: Fake MongoDB functions for confirmation-code tests.
// These prevent the tests from using the real Atlas database.
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockInsertOne = jest.fn();


// US-05/US-06 follow-up: Mock the shared database before loading the application.
jest.unstable_mockModule('../db.js', () => ({
    getDb: jest.fn(() => ({
        collection: jest.fn(() => ({
            findOne: mockFindOne,
            updateOne: mockUpdateOne,
            insertOne: mockInsertOne
        }))
    })),
    connectDb: jest.fn(),
    closeDb: jest.fn(),
    getClient: jest.fn()
}));

// Load the DormDash application after the database mock is ready.
const { createApp } = await import('../index.js');

const app = await createApp();
describe('POST /api/v1/deliveryConfirmation/generateCode', () => {

    beforeEach(() => {
        mockFindOne.mockReset();
        mockUpdateOne.mockReset();
        mockInsertOne.mockReset();
    });

    // US-05/US-06 follow-up: An already-confirmed delivery cannot generate another code.
    it('returns 409 when the delivery has already been confirmed', async () => {
        const userId = '507f1f77bcf86cd799439011';
        const deliveryId = '507f1f77bcf86cd799439012';

        // Signup: email does not already exist.
        mockFindOne.mockResolvedValueOnce(null);

        // Signup: MongoDB returns the new user's ID.
        mockInsertOne.mockResolvedValueOnce({
            insertedId: userId
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

        // generateCode: find the delivery.
        mockFindOne.mockResolvedValueOnce({
            _id: new ObjectId(deliveryId),
            requesterId: new ObjectId(userId),
            status: 'delivered'
        });

        // generateCode: find an existing confirmed code.
        mockFindOne.mockResolvedValueOnce({
            deliveryId: new ObjectId(deliveryId),
            confirmed: true
        });

        const res = await agent
            .post('/api/v1/deliveryConfirmation/generateCode')
            .send({ deliveryId });

        expect(res.status).toBe(409);
        expect(res.body.statusMessage).toBe(
            'Delivery has already been confirmed.'
        );
    });
    // US-05/US-06 follow-up: The requester can generate a confirmation code.
it('generates a 6-digit confirmation code for the requester', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const deliveryId = '507f1f77bcf86cd799439012';

    // Signup: email does not already exist.
    mockFindOne.mockResolvedValueOnce(null);

    // Signup: MongoDB returns the new user's ID.
    mockInsertOne.mockResolvedValueOnce({
        insertedId: userId
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

    // generateCode: find a delivery owned by this requester.
    mockFindOne.mockResolvedValueOnce({
        _id: new ObjectId(deliveryId),
        requesterId: new ObjectId(userId),
        status: 'picked_up'
    });

    // No existing confirmation-code record.
    mockFindOne.mockResolvedValueOnce(null);

    // MongoDB successfully stores the generated code.
    mockUpdateOne.mockResolvedValueOnce({
        acknowledged: true,
        modifiedCount: 1
    });

    const res = await agent
        .post('/api/v1/deliveryConfirmation/generateCode')
        .send({ deliveryId });

    expect(res.status).toBe(201);
    expect(res.body.statusMessage).toBe(
        'Confirmation code generated successfully.'
    );

    expect(res.body.content.code).toMatch(/^\d{6}$/);
});
});
// US-05/US-06 follow-up: Tests confirmation of a picked-up delivery.
describe('POST /api/v1/deliveryConfirmation/confirmCode', () => {

    // Reset the fake MongoDB functions before each confirmation test.
    beforeEach(() => {
        mockFindOne.mockReset();
        mockUpdateOne.mockReset();
        mockInsertOne.mockReset();
    });

    // US-05/US-06 follow-up: A valid code completes a picked-up delivery.
it('confirms a picked-up delivery with the correct code', async () => {
    const courierId = '507f1f77bcf86cd799439021';
    const deliveryId = '507f1f77bcf86cd799439022';
    const codeId = '507f1f77bcf86cd799439023';
    const code = '123456';

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

    // confirmCode: find a picked-up delivery assigned to this courier.
    mockFindOne.mockResolvedValueOnce({
        _id: new ObjectId(deliveryId),
        courierId: new ObjectId(courierId),
        status: 'picked_up'
    });

    // confirmCode: find the matching unconfirmed confirmation record.
    mockFindOne.mockResolvedValueOnce({
        _id: new ObjectId(codeId),
        deliveryId: new ObjectId(deliveryId),
        code,
        confirmed: false
    });

    // First updateOne marks the confirmation record as confirmed.
    mockUpdateOne.mockResolvedValueOnce({
        acknowledged: true,
        modifiedCount: 1
    });

    // Second updateOne changes the delivery status to delivered.
    mockUpdateOne.mockResolvedValueOnce({
        acknowledged: true,
        modifiedCount: 1
    });

    const res = await agent
        .post('/api/v1/deliveryConfirmation/confirmCode')
        .send({
            deliveryId,
            code
        });

    expect(res.status).toBe(200);
    expect(res.body.statusMessage).toBe(
        'Delivery confirmed successfully.'
    );

    expect(res.body.content.confirmed).toBe(true);

    // Verify that the delivery was changed from picked_up to delivered.
    expect(mockUpdateOne).toHaveBeenLastCalledWith(
        {
            _id: new ObjectId(deliveryId),
            status: 'picked_up'
        },
        {
            $set: {
                status: 'delivered',
                updatedAt: expect.any(Date)
            }
        }
    );

});
// US-05/US-06 follow-up: A delivery must be picked up before confirmation.
it('rejects confirmation when the delivery has not been picked up', async () => {
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

    // The courier owns this delivery, but it is only accepted, not picked_up.
    mockFindOne.mockResolvedValueOnce({
        _id: new ObjectId(deliveryId),
        courierId: new ObjectId(courierId),
        status: 'accepted'
    });

    // A confirmation code exists.
    mockFindOne.mockResolvedValueOnce({
        deliveryId: new ObjectId(deliveryId),
        code: '123456',
        confirmed: false
    });

    const res = await agent
        .post('/api/v1/deliveryConfirmation/confirmCode')
        .send({
            deliveryId,
            code: '123456'
        });

    expect(res.status).toBe(409);
    expect(res.body.statusMessage).toBe(
        'Delivery must be picked up before it can be confirmed.'
    );

    // Nothing should be updated.
    expect(mockUpdateOne).not.toHaveBeenCalled();
});
// US-05/US-06 follow-up: An incorrect confirmation code cannot complete a delivery.
it('rejects an incorrect confirmation code', async () => {
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

    // Find a picked-up delivery assigned to this courier.
    mockFindOne.mockResolvedValueOnce({
        _id: new ObjectId(deliveryId),
        courierId: new ObjectId(courierId),
        status: 'picked_up'
    });

    // The real confirmation code is 123456.
    mockFindOne.mockResolvedValueOnce({
        deliveryId: new ObjectId(deliveryId),
        code: '123456',
        confirmed: false
    });

    // Courier enters the wrong code.
    const res = await agent
        .post('/api/v1/deliveryConfirmation/confirmCode')
        .send({
            deliveryId,
            code: '654321'
        });

    expect(res.status).toBe(401);
    expect(res.body.statusMessage).toBe(
        'Incorrect confirmation code.'
    );

    // Wrong code must not update the confirmation record or delivery.
    expect(mockUpdateOne).not.toHaveBeenCalled();
});

});