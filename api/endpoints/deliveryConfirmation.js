import express from 'express';
import { randomInt, timingSafeEqual } from 'crypto';
import { getDb } from '../db.js';

const router = express.Router();
router.use(express.json());

const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;

const codes = getDb().collection('confirmationCodes');

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim() !== '';
}

// Called by the user who requested the delivery.
// Body: { orderId, userId }
router.post('/generateCode', async (req, res) => {
    const { orderId, userId } = req.body ?? {};
    if (!isNonEmptyString(orderId) || !isNonEmptyString(userId)) {
        return res.status(400).json({ error: 'orderId and userId are required' });
    }

    // TODO: Verify user is NOT a driver once users/orders collections exist.

    const existing = await codes.findOne({ orderId });
    if (existing && existing.userId !== userId) {
        return res.status(403).json({ error: 'Only the user who requested this delivery can generate its code' });
    }
    if (existing?.confirmed) {
        return res.status(409).json({ error: 'Delivery has already been confirmed' });
    }

    // Requesting again replaces the old code and resets the attempt counter.
    const code = randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, '0');
    await codes.updateOne(
        { orderId },
        {
            $set: { userId, code, attempts: 0, confirmed: false, createdAt: new Date() },
        },
        { upsert: true },
    );

    res.status(201).json({ orderId, code });
});

// Called by the driver, using the code the requester gave them.
// Body: { orderId, userId, code }
router.post('/confirmCode', async (req, res) => {
    const { orderId, userId, code } = req.body ?? {};
    if (!isNonEmptyString(orderId) || !isNonEmptyString(userId) || !isNonEmptyString(code)) {
        return res.status(400).json({ error: 'orderId, userId and code are required' });
    }

    // TODO: Verify user is the driver assigned to this order once users/orders collections exist.

    const record = await codes.findOne({ orderId });
    if (!record) {
        return res.status(404).json({ error: 'No confirmation code exists for this order' });
    }
    if (record.userId === userId) {
        return res.status(403).json({ error: 'The requester cannot confirm their own delivery' });
    }
    if (record.confirmed) {
        return res.status(409).json({ error: 'Delivery has already been confirmed' });
    }
    if (record.attempts >= MAX_ATTEMPTS) {
        return res.status(429).json({ error: 'Too many failed attempts; the requester must generate a new code' });
    }

    // Constant-time compare so response timing doesn't leak how many digits matched.
    const expected = Buffer.from(record.code);
    const actual = Buffer.from(code.trim());
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        await codes.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
        const attemptsLeft = MAX_ATTEMPTS - record.attempts - 1;
        return res.status(401).json({ error: 'Incorrect code', attemptsLeft });
    }

    // Filter on confirmed: false so two simultaneous confirms can't both succeed.
    const result = await codes.updateOne(
        { _id: record._id, confirmed: false },
        { $set: { confirmed: true, confirmedBy: userId, confirmedAt: new Date() } },
    );
    if (result.modifiedCount === 0) {
        return res.status(409).json({ error: 'Delivery has already been confirmed' });
    }

    res.status(200).json({ orderId, confirmed: true });
});

export default router;
