import express from 'express';
import { ObjectId } from 'mongodb';
import { randomInt, timingSafeEqual } from 'crypto';
import { getDb } from '../db.js';
const router = express.Router();

const CODE_LENGTH = 6;

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            statusCode: 401,
            statusMessage: 'You must be logged in.',
            content: {}
        });
    }
    next();
}

// Generates a confirmation code for the user who requested the delivery.
router.post('/generateCode', requireLogin, async (req, res) => {
    const { deliveryId } = req.body;
    const userId = req.session.user._id;

    if (!ObjectId.isValid(deliveryId)) {
        return res.status(400).json({
            statusCode: 400,
            statusMessage: 'Delivery ID must be a valid MongoDB ObjectId.',
            content: {}
        });
    }

    try {
        const db = getDb();

        const delivery = await db.collection('deliveries').findOne({ _id: new ObjectId(deliveryId) });
        if (!delivery) {
            return res.status(404).json({
                statusCode: 404,
                statusMessage: 'Delivery not found.',
                content: {}
            });
        }

        if (!delivery.requesterId.equals(userId)) {
            return res.status(403).json({
                statusCode: 403,
                statusMessage: 'Only the user who requested this delivery can generate its code.',
                content: {}
            });
        }

        const existing = await db.collection('confirmationCodes').findOne({ deliveryId: delivery._id });
        if (existing?.confirmed) {
            return res.status(409).json({
                statusCode: 409,
                statusMessage: 'Delivery has already been confirmed.',
                content: {}
            });
        }

        // Requesting again replaces the old code.
        const code = randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, '0');
        await db.collection('confirmationCodes').updateOne(
            { deliveryId: delivery._id },
            { $set: { userId: delivery.requesterId, code, confirmed: false, createdAt: new Date() } },
            { upsert: true }
        );

        return res.status(201).json({
            statusCode: 201,
            statusMessage: 'Confirmation code generated successfully.',
            content: { deliveryId: delivery._id, code }
        });

    } catch (error) {
        console.error('Failed to generate confirmation code:', error);

        return res.status(500).json({
            statusCode: 500,
            statusMessage: 'Failed to generate confirmation code.',
            content: {}
        });
    }
});

// Confirms a delivery using the code the requester gave the courier.
router.post('/confirmCode', requireLogin, async (req, res) => {
    const { deliveryId, code } = req.body;
    const userId = req.session.user._id;

    if (!ObjectId.isValid(deliveryId) || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({
            statusCode: 400,
            statusMessage: 'Delivery ID and code are required.',
            content: {}
        });
    }

    try {
        const db = getDb();

        const delivery = await db.collection('deliveries').findOne({ _id: new ObjectId(deliveryId) });
        if (!delivery) {
            return res.status(404).json({
                statusCode: 404,
                statusMessage: 'Delivery not found.',
                content: {}
            });
        }

        if (!delivery.courierId?.equals(userId)) {
            return res.status(403).json({
                statusCode: 403,
                statusMessage: 'Only the courier assigned to this delivery can confirm it.',
                content: {}
            });
        }

        const record = await db.collection('confirmationCodes').findOne({ deliveryId: delivery._id });
        if (!record) {
            return res.status(404).json({
                statusCode: 404,
                statusMessage: 'No confirmation code exists for this delivery.',
                content: {}
            });
        }

        if (record.confirmed) {
            return res.status(409).json({
                statusCode: 409,
                statusMessage: 'Delivery has already been confirmed.',
                content: {}
            });
        }

        // Compares in constant time so response timing doesn't leak how many digits matched.
        const expected = Buffer.from(record.code);
        const actual = Buffer.from(code.trim());
        if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
            return res.status(401).json({
                statusCode: 401,
                statusMessage: 'Incorrect confirmation code.',
                content: {}
            });
        }

        // Filtering on confirmed: false stops two simultaneous confirms from both succeeding.
        const result = await db.collection('confirmationCodes').updateOne(
            { _id: record._id, confirmed: false },
            { $set: { confirmed: true, confirmedBy: delivery.courierId, confirmedAt: new Date() } }
        );
        if (result.modifiedCount === 0) {
            return res.status(409).json({
                statusCode: 409,
                statusMessage: 'Delivery has already been confirmed.',
                content: {}
            });
        }

        return res.status(200).json({
            statusCode: 200,
            statusMessage: 'Delivery confirmed successfully.',
            content: { deliveryId: delivery._id, confirmed: true }
        });

    } catch (error) {
        console.error('Failed to confirm delivery:', error);

        return res.status(500).json({
            statusCode: 500,
            statusMessage: 'Failed to confirm delivery.',
            content: {}
        });
    }
});
export default router;
