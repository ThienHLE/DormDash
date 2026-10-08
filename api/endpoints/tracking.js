import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = express.Router();

function reply(res, code, message, content = {}) {
    return res.status(code).json({
        statusCode: code,
        statusMessage: message,
        content,
    });
}

// Require a login session for tracking endpoints.
router.use((req, res, next) => {
    if (!req.session?.user?._id) {
        return reply(res, 401, 'You must be logged in.');
    }

    next();
});

// POST /api/v1/tracking/update: save the assigned courier's latest GPS position.
router.post('/update', async (req, res) => {
    const {
        deliveryId,
        latitude,
        longitude,
        accuracy,
        capturedAt,
    } = req.body ?? {};

    if (
        typeof deliveryId !== 'string' ||
        !/^[a-f\d]{24}$/i.test(deliveryId)
    ) {
        return reply(res, 400, 'A valid deliveryId is required.');
    }

    if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180 ||
        !Number.isFinite(accuracy) ||
        accuracy < 0
    ) {
        return reply(res, 400, 'Valid coordinates and GPS accuracy are required.');
    }

    // capturedAt is the browser GPS timestamp in milliseconds.
    const now = Date.now();

    if (
        !Number.isFinite(capturedAt) ||
        capturedAt < now - 30000 ||
        capturedAt > now + 5000
    ) {
        return reply(res, 400, 'Send a GPS timestamp from the last 30 seconds.');
    }

    const db = getDb();
    const _id = new ObjectId(deliveryId);
    const userId = new ObjectId(req.session.user._id);

    const delivery = await db.collection('deliveries').findOne({ _id });

    if (!delivery) {
        return reply(res, 404, 'Delivery not found.');
    }

    if (delivery.courierId?.toString() !== userId.toString()) {
        return reply(res, 403, 'Only the assigned courier can update location.');
    }

    const confirmation = await db.collection('confirmationCodes').findOne({
        deliveryId: _id,
        confirmed: true,
    });

    if (delivery.status !== 'accepted' || confirmation) {
        return reply(res, 409, 'Tracking is not active for this delivery.');
    }

    const position = {
        userId,
        latitude,
        longitude,
        accuracy,
        capturedAt: new Date(capturedAt),
        updatedAt: new Date(),
    };

    // Use the delivery ID as _id: one latest-location document per delivery.
    // The update pipeline prevents older updates from replacing newer ones.
    await db.collection('tracking').updateOne(
        { _id },
        [
            {
                $replaceWith: {
                    $cond: [
                        {
                            $gt: [
                                { $literal: position.capturedAt },
                                { $ifNull: ['$capturedAt', new Date(0)] },
                            ],
                        },
                        {
                            $mergeObjects: [
                                '$$ROOT',
                                { $literal: position },
                            ],
                        },
                        '$$ROOT',
                    ],
                },
            },
        ],
        { upsert: true }
    );

    return reply(res, 200, 'Location update processed.', { deliveryId });
});

// POST /api/v1/tracking/location: let the requester read the courier's position.
router.post('/location', async (req, res) => {
    const { deliveryId } = req.body ?? {};

    if (
        typeof deliveryId !== 'string' ||
        !/^[a-f\d]{24}$/i.test(deliveryId)
    ) {
        return reply(res, 400, 'A valid deliveryId is required.');
    }

    const db = getDb();
    const _id = new ObjectId(deliveryId);
    const userId = req.session.user._id.toString();

    const delivery = await db.collection('deliveries').findOne({ _id });

    if (!delivery) {
        return reply(res, 404, 'Delivery not found.');
    }

    if (delivery.requesterId?.toString() !== userId) {
        return reply(res, 403, 'Only the requester can view this location.');
    }

    const confirmation = await db.collection('confirmationCodes').findOne({
        deliveryId: _id,
        confirmed: true,
    });

    if (delivery.status !== 'accepted' || confirmation) {
        return reply(res, 409, 'Tracking is not active for this delivery.');
    }

    // Do not return a former courier's position if the assignment changed.
    const position = await db.collection('tracking').findOne({
        _id,
        userId: delivery.courierId,
    });

    if (!position) {
        return reply(res, 200, 'Waiting for the courier location.', {
            deliveryId,
            trackingStatus: 'waiting',
            location: null,
        });
    }

    const capturedAt = position.capturedAt?.getTime();
    const ageMs = Date.now() - capturedAt;
    const stale = !Number.isFinite(ageMs) || ageMs > 15000;

    return reply(res, 200, 'Courier location retrieved.', {
        deliveryId,
        trackingStatus: stale ? 'stale' : 'live',
        location: {
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            capturedAt: position.capturedAt,
            updatedAt: position.updatedAt,
        },
    });
});



// Return JSON for unexpected database failures.
router.use((error, _req, res, _next) => {
    console.error('Tracking request failed:', error);
    return reply(res, 500, 'Unable to process tracking request.');
});

export default router;