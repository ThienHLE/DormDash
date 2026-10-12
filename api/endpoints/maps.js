import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = express.Router();

// POST /api/v1/maps/delivery: return markers and a pickup-to-drop-off walking route.
router.post('/delivery', async (req, res) => {
    const reply = (code, message, content = {}) =>
        res.status(code).json({
            statusCode: code,
            statusMessage: message,
            content,
        });

    const userId = req.session?.user?._id;

    if (!userId) {
        return reply(401, 'You must be logged in.');
    }

    const { deliveryId } = req.body ?? {};
    const validId = (value) =>
        typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

    if (!validId(deliveryId)) {
        return reply(400, 'A valid deliveryId is required.');
    }

    try {
        const db = getDb();
        const delivery = await db.collection('deliveries').findOne({
            _id: new ObjectId(deliveryId),
        });

        if (!delivery) {
            return reply(404, 'Delivery not found.');
        }

        const isRequester =
            delivery.requesterId?.toString() === userId.toString();
        const isCourier =
            delivery.courierId?.toString() === userId.toString();

        if (!isRequester && !isCourier) {
            return reply(403, 'You cannot access this delivery map.');
        }

        const pickupName = delivery.pickupLocation;
        const dropoffName = delivery.deliveryLocation;

        if (typeof pickupName !== 'string' || !pickupName.trim() ||
            typeof dropoffName !== 'string' || !dropoffName.trim()) {
            return reply(409, 'Map locations are not configured for this delivery.');
        }

        // Resolve existing deliveries even if a location was deactivated.
        const locations = db.collection('locations');
        const [pickup, dropoff] = await Promise.all([
            locations.findOne({ name: pickupName }),
            locations.findOne({ name: dropoffName }),
        ]);

        if (!pickup || !dropoff) {
            return reply(409, 'A delivery location name does not match a saved location.');
        }

        const validCoordinates = (location) =>
            Number.isFinite(location.latitude) &&
            location.latitude >= -90 &&
            location.latitude <= 90 &&
            Number.isFinite(location.longitude) &&
            location.longitude >= -180 &&
            location.longitude <= 180;

        if (!validCoordinates(pickup) || !validCoordinates(dropoff)) {
            return reply(409, 'Delivery locations need valid coordinates.');
        }

        const apiKey = process.env.ORS_API_KEY;
        if (!apiKey) {
            return reply(503, 'Walking route service is not configured.');
        }

        let routeData;
        try {
            // OpenRouteService and GeoJSON use [longitude, latitude].
            const routeResponse = await fetch(
                'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
                {
                    method: 'POST',
                    headers: {
                        Authorization: apiKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        coordinates: [
                            [pickup.longitude, pickup.latitude],
                            [dropoff.longitude, dropoff.latitude],
                        ],
                        instructions: false,
                    }),
                    signal: AbortSignal.timeout(10000),
                }
            );

            if (!routeResponse.ok) {
                return reply(502, 'Unable to retrieve a walking route.');
            }
            routeData = await routeResponse.json();
        } catch (error) {
            if (error.name === 'TimeoutError') {
                return reply(504, 'Walking route service timed out.');
            }
            return reply(502, 'Unable to retrieve a walking route.');
        }

        const feature = routeData?.features?.[0];
        const summary = feature?.properties?.summary;
        const coordinates = feature?.geometry?.coordinates;
        if (
            feature?.geometry?.type !== 'LineString' ||
            !Array.isArray(coordinates) || coordinates.length < 2 ||
            !coordinates.every((point) => Array.isArray(point) &&
                Number.isFinite(point[0]) && Math.abs(point[0]) <= 180 &&
                Number.isFinite(point[1]) && Math.abs(point[1]) <= 90) ||
            !Number.isFinite(summary?.distance) || summary.distance < 0 ||
            !Number.isFinite(summary?.duration) || summary.duration < 0
        ) {
            return reply(502, 'Walking route service returned an invalid response.');
        }

        const marker = (location) => ({
            _id: location._id,
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
        });

        return reply(200, 'Delivery map and walking route retrieved.', {
            deliveryId: delivery._id,
            status: delivery.status,
            pickup: marker(pickup),
            dropoff: marker(dropoff),
            route: {
                geometry: feature.geometry,
                distanceMeters: summary.distance,
                durationSeconds: summary.duration,
                attribution: routeData.metadata?.attribution,
            },
        });
    } catch (error) {
        console.error('Failed to retrieve delivery map:', error);
        return reply(500, 'Unable to retrieve delivery map.');
    }
});

export default router;
