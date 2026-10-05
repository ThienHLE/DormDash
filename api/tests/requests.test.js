import request from 'supertest';
import { jest } from '@jest/globals';

// Creates fake MongoDB functions so tests do not use the real Atlas database.
const mockToArray = jest.fn();
const mockSort = jest.fn(() => ({
    toArray: mockToArray
}));

const mockFind = jest.fn(() => ({
    sort: mockSort,
    toArray: mockToArray
}));

// Mocks the shared database connection before the application loads.
jest.unstable_mockModule('../db.js', () => ({
    getDb: jest.fn(() => ({
        collection: jest.fn(() => ({
            find: mockFind
        }))
    })),
    connectDb: jest.fn(),
    closeDb: jest.fn(),
    getClient: jest.fn()
}));

// Imports the application after the database mock is created.
const { createApp } = await import('../index.js');

const app = await createApp();

describe('POST /api/v1/requests/list', () => {

    beforeEach(() => {
        mockFind.mockClear();
        mockToArray.mockReset();
        mockSort.mockClear();
    });

    // Tests the existing US-03 behavior with no filters.
    it('returns all open unassigned delivery requests when no filters are provided', async () => {

        const availableRequests = [
            {
                _id: 'delivery-1',
                item: 'Coffee',
                pickupLocation: 'Boreham Library',
                deliveryLocation: 'Smith-Pendergraft Campus Center',
                tip: 300,
                status: 'open',
                courierId: null
            },
            {
                _id: 'delivery-2',
                item: 'Lunch',
                pickupLocation: "Lion's Den",
                deliveryLocation: 'Sebastian Commons',
                tip: 600,
                status: 'open',
                courierId: null
            }
        ];

        mockToArray.mockResolvedValue(availableRequests);

        const res = await request(app)
            .post('/api/v1/requests/list')
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.statusCode).toBe(200);
        expect(res.body.message).toBe(
            'Available delivery requests retrieved'
        );
        expect(res.body.data).toEqual(availableRequests);

        expect(mockFind).toHaveBeenCalledWith({
            status: 'open',
            courierId: null
        });
    });
    // Tests filtering by a building that can match either pickup or delivery location.
    it('filters available requests by pickup or delivery location', async () => {

        mockToArray.mockResolvedValue([
            {
                _id: 'delivery-1',
                item: 'Coffee',
                pickupLocation: 'Boreham Library',
                deliveryLocation: 'Smith-Pendergraft Campus Center',
                tip: 300,
                status: 'open',
                courierId: null
            }
        ]);

        const res = await request(app)
            .post('/api/v1/requests/list')
            .send({
                location: 'Boreham Library'
            });

        expect(res.status).toBe(200);

        expect(mockFind).toHaveBeenCalledWith({
            status: 'open',
            courierId: null,
            $or: [
                { pickupLocation: 'Boreham Library' },
                { deliveryLocation: 'Boreham Library' }
            ]
        });

        expect(res.body.data).toHaveLength(1);
    });
    // US-08: Tests filtering available requests by tip range.
    it('filters available requests by tip range', async () => {

        mockToArray.mockResolvedValue([
            {
                _id: 'delivery-1',
                item: 'Coffee',
                pickupLocation: 'Boreham Library',
                deliveryLocation: 'Smith-Pendergraft Campus Center',
                tip: 450,
                status: 'open',
                courierId: null
            }
        ]);

        const res = await request(app)
            .post('/api/v1/requests/list')
            .send({
                tipMin: 300,
                tipMax: 599
            });

        expect(res.status).toBe(200);

        expect(mockFind).toHaveBeenCalledWith({
            status: 'open',
            courierId: null,
            tip: {
                $gte: 300,
                $lte: 599
            }
        });

        expect(res.body.data).toHaveLength(1);
    });
    // US-08: Tests location and tip filters working together.
    it('filters available requests by location and tip range together', async () => {

        mockToArray.mockResolvedValue([
            {
                _id: 'delivery-1',
                item: 'Coffee',
                pickupLocation: 'Boreham Library',
                deliveryLocation: 'Sebastian Commons',
                tip: 450,
                status: 'open',
                courierId: null
            }
        ]);

        const res = await request(app)
            .post('/api/v1/requests/list')
            .send({
                location: 'Boreham Library',
                tipMin: 300,
                tipMax: 599
            });

        expect(res.status).toBe(200);

        expect(mockFind).toHaveBeenCalledWith({
            status: 'open',
            courierId: null,
            $or: [
                { pickupLocation: 'Boreham Library' },
                { deliveryLocation: 'Boreham Library' }
            ],
            tip: {
                $gte: 300,
                $lte: 599
            }
        });

        expect(res.body.data).toHaveLength(1);
    });
    // US-08: Tests the highest tip range with no maximum value.
    it('filters available requests for tips of $10 or more', async () => {

        mockToArray.mockResolvedValue([
            {
                _id: 'delivery-1',
                item: 'Dinner',
                pickupLocation: "Lion's Den",
                deliveryLocation: 'Sebastian Commons',
                tip: 1200,
                status: 'open',
                courierId: null
            }
        ]);

        const res = await request(app)
            .post('/api/v1/requests/list')
            .send({
                tipMin: 1000
            });

        expect(res.status).toBe(200);

        expect(mockFind).toHaveBeenCalledWith({
            status: 'open',
            courierId: null,
            tip: {
                $gte: 1000
            }
        });

        expect(res.body.data).toHaveLength(1);
    });
    // US-08: Rejects invalid negative tip filter values.
    it('rejects a negative tip filter', async () => {

        const res = await request(app)
            .post('/api/v1/requests/list')
            .send({
                tipMin: -100
            });

        expect(res.status).toBe(400);
        expect(res.body.statusCode).toBe(400);
        expect(res.body.message).toBe(
            'Tip filters must be non-negative integers in cents'
        );

        // Invalid filters should be rejected before querying MongoDB.
        expect(mockFind).not.toHaveBeenCalled();
    });
    // US-08: Rejects a tip range when the minimum is greater than the maximum.
    it('rejects a tip range when minimum is greater than maximum', async () => {

        const res = await request(app)
            .post('/api/v1/requests/list')
            .send({
                tipMin: 600,
                tipMax: 299
            });

        expect(res.status).toBe(400);
        expect(res.body.statusCode).toBe(400);
        expect(res.body.message).toBe(
            'Minimum tip cannot be greater than maximum tip'
        );

        expect(mockFind).not.toHaveBeenCalled();
    });
    // US-08: Sorts available requests by tip from lowest to highest.
    it('sorts available requests by tip from low to high', async () => {

        mockToArray.mockResolvedValue([
            { _id: 'delivery-1', tip: 300 },
            { _id: 'delivery-2', tip: 600 }
        ]);

        const res = await request(app)
            .post('/api/v1/requests/list')
            .send({
                sortBy: 'tip',
                sortOrder: 'asc'
            });

        expect(res.status).toBe(200);

        expect(mockFind).toHaveBeenCalledWith({
            status: 'open',
            courierId: null
        });

        expect(mockSort).toHaveBeenCalledWith({
            tip: 1
        });
    });
    // US-08: Sorts available requests by tip from highest to lowest.
    it('sorts available requests by tip from high to low', async () => {

        mockToArray.mockResolvedValue([
            { _id: 'delivery-1', tip: 1000 },
            { _id: 'delivery-2', tip: 300 }
        ]);

        const res = await request(app)
            .post('/api/v1/requests/list')
            .send({
                sortBy: 'tip',
                sortOrder: 'desc'
            });

        expect(res.status).toBe(200);

        expect(mockFind).toHaveBeenCalledWith({
            status: 'open',
            courierId: null
        });

        expect(mockSort).toHaveBeenCalledWith({
            tip: -1
        });
    });
    // US-08: Sorts available requests by pickup location from A to Z.
    it('sorts available requests by pickup location from A to Z', async () => {

        mockToArray.mockResolvedValue([
            {
                _id: 'delivery-1',
                pickupLocation: 'Boreham Library'
            },
            {
                _id: 'delivery-2',
                pickupLocation: 'Sebastian Commons'
            }
        ]);

        const res = await request(app)
            .post('/api/v1/requests/list')
            .send({
                sortBy: 'pickupLocation',
                sortOrder: 'asc'
            });

        expect(res.status).toBe(200);

        expect(mockFind).toHaveBeenCalledWith({
            status: 'open',
            courierId: null
        });

        expect(mockSort).toHaveBeenCalledWith({
            pickupLocation: 1
        });
    });
    // US-08: Sorts available requests by pickup location from Z to A.
    it('sorts available requests by pickup location from Z to A', async () => {

        mockToArray.mockResolvedValue([
            {
                _id: 'delivery-1',
                pickupLocation: 'Sebastian Commons'
            },
            {
                _id: 'delivery-2',
                pickupLocation: 'Boreham Library'
            }
        ]);

        const res = await request(app)
            .post('/api/v1/requests/list')
            .send({
                sortBy: 'pickupLocation',
                sortOrder: 'desc'
            });

        expect(res.status).toBe(200);

        expect(mockFind).toHaveBeenCalledWith({
            status: 'open',
            courierId: null
        });

        expect(mockSort).toHaveBeenCalledWith({
            pickupLocation: -1
        });
    });
    // US-08: Rejects unsupported sorting fields.
it('rejects an invalid sort field', async () => {

    const res = await request(app)
        .post('/api/v1/requests/list')
        .send({
            sortBy: 'item',
            sortOrder: 'asc'
        });

    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.message).toBe(
        'Sort field must be tip or pickupLocation'
    );

    expect(mockFind).not.toHaveBeenCalled();
});

// US-08: Rejects unsupported sorting directions.
it('rejects an invalid sort order', async () => {

    const res = await request(app)
        .post('/api/v1/requests/list')
        .send({
            sortBy: 'tip',
            sortOrder: 'random'
        });

    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.message).toBe(
        'Sort order must be asc or desc'
    );

    expect(mockFind).not.toHaveBeenCalled();
});
});