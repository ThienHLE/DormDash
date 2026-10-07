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

// Require a signed-in user for all location endpoints.
router.use((req, res, next) => {
    if (!req.session?.user?._id) {
        return reply(res, 401, 'You must be logged in.');
    }

    next();
});

// POST /api/v1/locations/list: return active locations for maps and dropdowns.
router.post('/list', async (_req, res) => {
    const locations = await getDb()
        .collection('locations')
        .find({ active: true })
        .sort({ name: 1 })
        .toArray();

    return reply(res, 200, 'Locations retrieved.', { locations });
});

// POST /api/v1/locations/create: allow an admin to save a named map marker.
router.post('/create', async (req, res) => {
    const db = getDb();

    // Check the current database role instead of trusting a client-supplied role.
    const user = await db.collection('users').findOne({
        _id: new ObjectId(req.session.user._id),
    });

    if (!user?.admin) {
        return reply(res, 403, 'Admin access required.');
    }

    const { name, latitude, longitude } = req.body ?? {};

    if (
        typeof name !== 'string' ||
        !name.trim() ||
        name.trim().length > 100
    ) {
        return reply(res, 400, 'Name must contain 1–100 characters.');
    }

    if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {
        return reply(res, 400, 'Valid numeric latitude and longitude are required.');
    }

    const now = new Date();
    const location = {
        name: name.trim(),
        latitude,
        longitude,
        active: true,
        createdAt: now,
        updatedAt: now,
    };

    // Names are stable references, so duplicates (including inactive names) are forbidden.
    const locations = db.collection('locations');
    await locations.createIndex({ name: 1 }, { unique: true });
    const { insertedId } = await locations.insertOne(location);

    return reply(res, 201, 'Location created.', {
        location: { ...location, _id: insertedId },
    });
});

// POST /api/v1/locations/:id/deactivate: hide a location from future selections.
router.post('/:id/deactivate', async (req, res) => {
    const db = getDb();

    const user = await db.collection('users').findOne({
        _id: new ObjectId(req.session.user._id),
    });

    if (!user?.admin) {
        return reply(res, 403, 'Admin access required.');
    }

    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
        return reply(res, 400, 'A valid location ID is required.');
    }

    const location = await db.collection('locations').findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        {
            $set: { active: false },
            $currentDate: { updatedAt: true },
        },
        { returnDocument: 'after', includeResultMetadata: false }
    );

    if (!location) {
        return reply(res, 404, 'Location not found.');
    }

    return reply(res, 200, 'Location deactivated.', { location });
});



// Return a consistent JSON response for unexpected failures.
router.use((error, _req, res, _next) => {
    if (error.code === 11000) {
        return reply(res, 409, 'Location name already exists or existing duplicates need cleanup.');
    }
    console.error('Location endpoint failed:', error);
    return reply(res, 500, 'Unable to process location request.');
});

export default router;