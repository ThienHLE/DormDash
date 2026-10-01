import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = express.Router();
router.use(express.json());
const validId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const reply = (res, statusCode, message, data = null) =>
    res.status(statusCode).json({ statusCode, message, data });

// POST /api/v1/requests/list: return open, unassigned deliveries (tip is in cents).
router.post('/list', async (_req, res) => {
    const requests = await getDb().collection('deliveries').find({
        status: 'open',
        courierId: null,
    }).toArray();
    return reply(res, 200, 'Available delivery requests retrieved', requests);
});

// POST /api/v1/requests/my: return deliveries assigned to the specified courier.
router.post('/my', async (req, res) => {
    if (!validId(req.body?.courierId)) return reply(res, 400, 'A valid courierId is required');
    const requests = await getDb().collection('deliveries').find({
        courierId: new ObjectId(req.body.courierId),
    }).toArray();
    return reply(res, 200, 'My delivery requests retrieved', requests);
});

// POST /api/v1/requests/:id/detail: return a delivery and its current status.
router.post('/:id/detail', async (req, res) => {
    if (!validId(req.params.id)) return reply(res, 400, 'Invalid request ID');
    const delivery = await getDb().collection('deliveries').findOne({
        _id: new ObjectId(req.params.id),
    });
    if (!delivery) return reply(res, 404, 'Delivery request not found');
    return reply(res, 200, 'Delivery request retrieved', delivery);
});

// POST /api/v1/requests/:id/accept  accept a delivery using { courierId } in the JSON body.
router.post('/:id/accept', async (req, res) => {
    if (!validId(req.params.id)) return reply(res, 400, 'Invalid request ID');
    // Temporary local-testing. Replace with authenticated user identity later.
    if (!validId(req.body?.courierId)) return reply(res, 400, 'A valid courierId is required');

    const collection = getDb().collection('deliveries');
    const _id = new ObjectId(req.params.id);
    const delivery = await collection.findOneAndUpdate(
        { _id, status: 'open', courierId: null },
        {
            $set: { courierId: new ObjectId(req.body.courierId), status: 'accepted' },
            $currentDate: { updatedAt: true },
        },
        { returnDocument: 'after', includeResultMetadata: false },
    );
    if (delivery) return reply(res, 200, 'Delivery request accepted', delivery);
    const exists = await collection.findOne({ _id }, { projection: { _id: 1 } });
    return exists
        ? reply(res, 409, 'Delivery request is no longer available')
        : reply(res, 404, 'Delivery request not found');
});

// Return JSON for body parsing and database errors in request routes.
router.use((err, _req, res, _next) => {
    const statusCode = err.type === 'entity.parse.failed' ? 400
        : err.type === 'entity.too.large' ? 413 : 500;
    const message = statusCode === 400 ? 'Invalid JSON body'
        : statusCode === 413 ? 'Request body too large' : 'Unable to process request';
    if (statusCode === 500) console.error(err);
    return reply(res, statusCode, message);
});

export default router;
