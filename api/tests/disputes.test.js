import { jest } from '@jest/globals';
import request from 'supertest';
import { ObjectId } from 'mongodb';

let users = [];
let disputes = [];
let deliveries = [];

const sameId = (left, right) => String(left) === String(right);
const matches = (document, filter = {}) => Object.entries(filter).every(([key, value]) => {
    if (key === '$or') return value.some((condition) => matches(document, condition));
    if (value && typeof value === 'object' && '$in' in value) {
        return value.$in.some((candidate) => sameId(document[key], candidate));
    }
    return key === '_id' ? sameId(document._id, value) : sameId(document[key], value);
});

const fakeDb = {
    collection: (name) => {
        const documents = name === 'users' ? users : name === 'deliveries' ? deliveries : disputes;
        return {
            createIndex: async () => 'unique_dispute_per_post_and_creator',
            findOne: async (filter) => documents.find((document) => matches(document, filter)) ?? null,
            find: (filter, options = {}) => ({
                sort: (sort) => ({
                    toArray: async () => documents
                        .filter((document) => matches(document, filter))
                        .sort((left, right) => {
                            for (const [key, direction] of Object.entries(sort)) {
                                const leftValue = left[key] instanceof Date ? left[key].getTime() : left[key];
                                const rightValue = right[key] instanceof Date ? right[key].getTime() : right[key];
                                if (leftValue < rightValue) return -direction;
                                if (leftValue > rightValue) return direction;
                            }
                            return 0;
                        })
                        .map((document) => options.projection?._id === 1 ? { _id: document._id } : document)
                }),
                toArray: async () => documents
                    .filter((document) => matches(document, filter))
                    .map((document) => options.projection?._id === 1 ? { _id: document._id } : document)
            }),
            insertOne: async (document) => {
                const _id = new ObjectId();
                documents.push({ ...document, _id });
                return { insertedId: _id };
            },
            deleteOne: async (filter) => {
                const index = documents.findIndex((document) => matches(document, filter));
                if (index === -1) return { deletedCount: 0 };
                documents.splice(index, 1);
                return { deletedCount: 1 };
            },
            findOneAndUpdate: async (filter, update) => {
                const document = documents.find((candidate) => matches(candidate, filter));
                if (!document) return null;
                Object.assign(document, update.$set);
                return document;
            }
        };
    }
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
    disputes = [];
    deliveries = [];
});

async function signedUpAgent(email) {
    const agent = request.agent(app);
    const response = await agent.post('/api/v1/auth/signup').send({
        email,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
    });
    expect(response.status).toBe(201);
    return { agent, userId: response.body.content.user._id };
}

describe('disputes', () => {
    it('requires login to list and create disputes', async () => {
        expect((await request(app).get('/api/v1/disputes')).status).toBe(401);
        expect((await request(app).post('/api/v1/disputes/create').send({})).status).toBe(401);
    });

    it('creates a dispute with authenticated parties, role snapshots, message, and initial status', async () => {
        const { agent, userId } = await signedUpAgent('creator@school.edu');
        const target = await signedUpAgent('target@school.edu');
        const postId = new ObjectId();
        deliveries.push({
            _id: postId,
            requesterId: new ObjectId(userId),
            courierId: new ObjectId(target.userId)
        });
        const response = await agent.post('/api/v1/disputes/create').send({
            postId: postId.toString(),
            message: '  The package was not delivered.  '
        });

        expect(response.status).toBe(201);
        expect(response.body.content.dispute).toMatchObject({
            postId: postId.toString(),
            createdBy: userId,
            createdByRole: 'student',
            disputedUserId: target.userId,
            disputedUserRole: 'student',
            message: 'The package was not delivered.',
            status: 'In Review'
        });
        expect(disputes).toHaveLength(1);
    });

    it('validates dispute parties and message', async () => {
        const { agent, userId } = await signedUpAgent('creator@school.edu');
        const target = await signedUpAgent('target@school.edu');
        const postId = new ObjectId();
        deliveries.push({
            _id: postId,
            requesterId: new ObjectId(userId),
            courierId: new ObjectId(target.userId)
        });

        expect((await agent.post('/api/v1/disputes/create').send({
            postId: 'invalid',
            message: 'A message'
        })).status).toBe(400);
        expect((await agent.post('/api/v1/disputes/create').send({
            postId: new ObjectId().toString(),
            message: 'A message'
        })).status).toBe(404);
        expect((await agent.post('/api/v1/disputes/create').send({
            postId: postId.toString(),
            message: ' '
        })).status).toBe(400);
        expect(disputes).toHaveLength(0);
    });

    it('rejects reports from users not involved in the delivery', async () => {
        const { agent } = await signedUpAgent('outsider@school.edu');
        const requester = await signedUpAgent('requester@school.edu');
        const courier = await signedUpAgent('courier@school.edu');
        const postId = new ObjectId();
        deliveries.push({
            _id: postId,
            requesterId: new ObjectId(requester.userId),
            courierId: new ObjectId(courier.userId)
        });

        const response = await agent.post('/api/v1/disputes/create').send({
            postId: postId.toString(),
            message: 'Report from an outsider'
        });

        expect(response.status).toBe(403);
        expect(disputes).toHaveLength(0);
    });

    it('allows one report per user for a delivery but allows the other participant to report too', async () => {
        const { agent: requesterAgent, userId: requesterId } = await signedUpAgent('requester@school.edu');
        const { agent: courierAgent, userId: courierId } = await signedUpAgent('courier@school.edu');
        const postId = new ObjectId();
        deliveries.push({
            _id: postId,
            requesterId: new ObjectId(requesterId),
            courierId: new ObjectId(courierId)
        });

        const firstReport = await requesterAgent.post('/api/v1/disputes/create').send({
            postId: postId.toString(),
            message: 'Report from requester'
        });
        const duplicateReport = await requesterAgent.post('/api/v1/disputes/create').send({
            postId: postId.toString(),
            message: 'Second report from requester'
        });
        const otherParticipantReport = await courierAgent.post('/api/v1/disputes/create').send({
            postId: postId.toString(),
            message: 'Report from courier'
        });

        expect(firstReport.status).toBe(201);
        expect(duplicateReport.status).toBe(409);
        expect(otherParticipantReport.status).toBe(201);
        expect(disputes).toHaveLength(2);
    });

    it('returns a conflict when the delivery has an invalid other participant ID', async () => {
        const { agent, userId } = await signedUpAgent('reporter@school.edu');
        const postId = new ObjectId();
        deliveries.push({
            _id: postId,
            requesterId: new ObjectId(userId),
            courierId: 'not-a-valid-user-id'
        });

        const response = await agent.post('/api/v1/disputes/create').send({
            postId: postId.toString(),
            message: 'The delivery was not completed'
        });

        expect(response.status).toBe(409);
        expect(response.body.statusMessage).toBe('The other participant has an invalid user ID.');
        expect(disputes).toHaveLength(0);
    });

    it('lists all statuses where the logged-in user is either party', async () => {
        const { agent, userId } = await signedUpAgent('involved@school.edu');
        const otherId = new ObjectId();
        const thirdId = new ObjectId();
        disputes = [
            { _id: new ObjectId(), createdBy: new ObjectId(userId), disputedUserId: otherId, status: 'In Review', createdAt: new Date(1) },
            { _id: new ObjectId(), createdBy: thirdId, disputedUserId: new ObjectId(userId), status: 'Resolved', createdAt: new Date(2) },
            { _id: new ObjectId(), createdBy: otherId, disputedUserId: thirdId, status: 'In Review', createdAt: new Date(3) }
        ];

        const response = await agent.get('/api/v1/disputes');

        expect(response.status).toBe(200);
        expect(response.body.content.disputes.map(({ _id }) => _id)).toEqual([
            disputes[1]._id.toString(),
            disputes[0]._id.toString()
        ]);
    });

    it('lists all disputes to admins with an optional status filter', async () => {
        const { agent: adminAgent } = await signedUpAgent('admin@school.edu');
        users[0].admin = true;
        const { agent: studentAgent } = await signedUpAgent('student@school.edu');
        disputes = [
            { _id: new ObjectId(), status: 'In Review', createdAt: new Date(1) },
            { _id: new ObjectId(), status: 'Resolved', createdAt: new Date(2) },
            { _id: new ObjectId(), status: 'No Action', createdAt: new Date(3) }
        ];

        const forbidden = await studentAgent.get('/api/v1/disputes/listAll');
        const response = await adminAgent.get('/api/v1/disputes/listAll');
        const filtered = await adminAgent.get('/api/v1/disputes/listAll?status=Resolved');
        const invalidStatus = await adminAgent.get('/api/v1/disputes/listAll?status=Unknown');
        const oldestFirst = await adminAgent.get('/api/v1/disputes/listAll?sortBy=oldest');
        const statusAscending = await adminAgent.get('/api/v1/disputes/listAll?sortBy=statusAsc');
        const invalidSort = await adminAgent.get('/api/v1/disputes/listAll?sortBy=unknown');

        expect(forbidden.status).toBe(403);
        expect(response.status).toBe(200);
        expect(response.body.content.disputes).toHaveLength(3);
        expect(response.body.content.disputes[0]._id).toBe(disputes[2]._id.toString());
        expect(filtered.status).toBe(200);
        expect(filtered.body.content.disputes).toHaveLength(1);
        expect(filtered.body.content.disputes[0].status).toBe('Resolved');
        expect(invalidStatus.status).toBe(400);
        expect(oldestFirst.status).toBe(200);
        expect(oldestFirst.body.content.disputes[0]._id).toBe(disputes[0]._id.toString());
        expect(statusAscending.body.content.disputes.map(({ status }) => status)).toEqual([
            'In Review', 'No Action', 'Resolved'
        ]);
        expect(invalidSort.status).toBe(400);
    });

    it('includes whether each dispute linked delivery post still exists', async () => {
        const { agent: adminAgent } = await signedUpAgent('admin@school.edu');
        users[0].admin = true;
        const existingPostId = new ObjectId();
        const missingPostId = new ObjectId();
        deliveries.push({ _id: existingPostId });
        disputes = [
            { _id: new ObjectId(), postId: existingPostId, status: 'In Review', createdAt: new Date(1) },
            { _id: new ObjectId(), postId: missingPostId, status: 'Resolved', createdAt: new Date(2) }
        ];

        const response = await adminAgent.get('/api/v1/disputes/listAll');

        expect(response.status).toBe(200);
        expect(response.body.content.disputes.map(({ postExists }) => postExists)).toEqual([false, true]);
    });

    it('allows only admins to change a dispute to a valid status', async () => {
        const { agent: adminAgent } = await signedUpAgent('admin@school.edu');
        users[0].admin = true;
        const { agent: studentAgent } = await signedUpAgent('student@school.edu');
        const disputeId = new ObjectId();
        disputes.push({
            _id: disputeId,
            status: 'In Review',
            updatedAt: new Date(1)
        });

        const forbidden = await studentAgent.put(`/api/v1/disputes/updateStatus/${disputeId}`).send({ status: 'Resolved' });
        const invalidStatus = await adminAgent.put(`/api/v1/disputes/updateStatus/${disputeId}`).send({ status: 'Ignored' });
        const response = await adminAgent.put(`/api/v1/disputes/updateStatus/${disputeId}`).send({ status: 'Resolved' });

        expect(forbidden.status).toBe(403);
        expect(invalidStatus.status).toBe(400);
        expect(response.status).toBe(200);
        expect(response.body.content.dispute.status).toBe('Resolved');
    });

    it('allows only admins to delete a dispute-linked delivery post', async () => {
        const { agent: adminAgent } = await signedUpAgent('admin@school.edu');
        users[0].admin = true;
        const { agent: studentAgent } = await signedUpAgent('student@school.edu');
        const disputeId = new ObjectId();
        const postId = new ObjectId();
        disputes.push({ _id: disputeId, postId });
        deliveries.push({ _id: postId });

        const forbidden = await studentAgent.delete(`/api/v1/disputes/${disputeId}/post`);
        const response = await adminAgent.delete(`/api/v1/disputes/${disputeId}/post`);

        expect(forbidden.status).toBe(403);
        expect(response.status).toBe(200);
        expect(deliveries).toHaveLength(0);
        expect(disputes).toHaveLength(1);
    });
});
