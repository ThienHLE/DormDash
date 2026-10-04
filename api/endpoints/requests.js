import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = express.Router();
router.use(express.json());
const validId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const reply = (res, statusCode, message, data = null) =>
    res.status(statusCode).json({ statusCode, message, data });

// POST /api/v1/requests/list: return open, unassigned deliveries (tip is in cents).
router.post('/list', async (req, res) => {
    // US-08: Validate tip filters before querying the database.
    const { tipMin, tipMax, sortBy, sortOrder } = req.body ?? {};
    const invalidTip =
        (tipMin !== undefined &&
            (!Number.isInteger(tipMin) || tipMin < 0)) ||
        (tipMax !== undefined &&
            (!Number.isInteger(tipMax) || tipMax < 0));

    if (invalidTip) {
        return reply(
            res,
            400,
            'Tip filters must be non-negative integers in cents'
        );
    }
    // US-08: The minimum tip cannot be greater than the maximum tip.
    if (
        tipMin !== undefined &&
        tipMax !== undefined &&
        tipMin > tipMax
    ) {
        return reply(
            res,
            400,
            'Minimum tip cannot be greater than maximum tip'
        );
    }

    // US-08: Base query keeps only open, unassigned deliveries.
    const filter = {
        status: 'open',
        courierId: null,
    };
    // US-08: Only supported fields can be used for sorting.
    if (
        sortBy !== undefined &&
        !['tip', 'pickupLocation'].includes(sortBy)
    ) {
        return reply(
            res,
            400,
            'Sort field must be tip or pickupLocation'
        );
    }

    // US-08: Sorting direction must be ascending or descending.
    if (
        sortOrder !== undefined &&
        !['asc', 'desc'].includes(sortOrder)
    ) {
        return reply(
            res,
            400,
            'Sort order must be asc or desc'
        );
    }
    // US-08: Filter by a building that matches either pickup or delivery location.
    if (req.body?.location) {
        filter.$or = [
            { pickupLocation: req.body.location },
            { deliveryLocation: req.body.location }
        ];
    }
    // US-08: Filter by tip range. Tips are stored as integer cents.
    if (tipMin !== undefined || tipMax !== undefined) {
        filter.tip = {};

        if (tipMin !== undefined) {
            filter.tip.$gte = tipMin;
        }

        if (tipMax !== undefined) {
            filter.tip.$lte = tipMax;
        }
    }

    // US-08: Build the database query using the selected filters.
    let query = getDb()
        .collection('deliveries')
        .find(filter);

    // US-08: Sort tips from lowest to highest or highest to lowest.
    if (sortBy === 'tip') {
        const direction = sortOrder === 'desc' ? -1 : 1;
        query = query.sort({
            tip: direction
        });
    }
    // US-08: Sort requests alphabetically by pickup location.
    if (sortBy === 'pickupLocation') {
        const direction = sortOrder === 'desc' ? -1 : 1;

        query = query.sort({
            pickupLocation: direction
        });
    }

    const requests = await query.toArray();

    return reply(
        res,
        200,
        'Available delivery requests retrieved',
        requests
    );
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
