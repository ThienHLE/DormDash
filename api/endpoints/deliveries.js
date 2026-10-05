import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
const router = express.Router();
// Creates a new delivery request.
router.post('/createDeliveryRequest', async (req, res) => {
    // Gets the delivery information sent by the frontend.
    const {
        requesterId,
        item,
        instructions,
        pickupLocation,
        deliveryLocation,
        tip
    } = req.body;
    // Checks that all required delivery information was provided.
    if (!requesterId || !item || !pickupLocation || !deliveryLocation || tip === undefined) {
        return res.status(400).json({
            statusCode: 400,
            statusMessage: 'Requester ID, item, pickup location, delivery location, and tip are required.',
            content: {}
        });
    }
    // Checks that requesterId is a valid MongoDB ObjectId.
    if (!ObjectId.isValid(requesterId)) {
        return res.status(400).json({
            statusCode: 400,
            statusMessage: 'Requester ID must be a valid MongoDB ObjectId.',
            content: {}
        });
    }



    // Checks that the tip is a valid non-negative integer in cents.
    if (!Number.isInteger(tip) || tip < 0) {
        return res.status(400).json({
            statusCode: 400,
            statusMessage: 'Tip must be a non-negative integer in cents.',
            content: {}
        });
    }
    // Creates the delivery document that will be saved in MongoDB.
    const delivery = {
        requesterId: new ObjectId(requesterId),
        item,
        instructions: instructions ?? '',
        pickupLocation,
        deliveryLocation,
        tip,
        courierId: null,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    // Gets the shared DormDash database connection.
    // Tries to save the new delivery in MongoDB.
    try {
        // Gets the shared DormDash database connection.
        const db = getDb();

        // Saves the new delivery in the deliveries collection.
        const result = await db.collection('deliveries').insertOne(delivery);

        // Returns 201 Created after the delivery is successfully saved.
        return res.status(201).json({
            statusCode: 201,
            statusMessage: 'Delivery request created successfully.',
            content: {
                _id: result.insertedId,
                ...delivery
            }
        });

    } catch (error) {
        // Logs the actual database error for developers.
        console.error('Failed to create delivery request:', error);

        // Returns a safe error message to the client.
        return res.status(500).json({
            statusCode: 500,
            statusMessage: 'Failed to create delivery request.',
            content: {}
        });
    }
});

// Marks an accepted delivery as picked up by its assigned courier (from the session).
router.post('/pickUpDelivery', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            statusCode: 401,
            statusMessage: 'You must be logged in.',
            content: {}
        });
    }

    const { deliveryId } = req.body;
    if (!ObjectId.isValid(deliveryId)) {
        return res.status(400).json({
            statusCode: 400,
            statusMessage: 'Delivery ID must be a valid MongoDB ObjectId.',
            content: {}
        });
    }

    try {
        const delivery = await getDb().collection('deliveries').findOneAndUpdate(
            { _id: new ObjectId(deliveryId), status: 'accepted', courierId: new ObjectId(req.session.user._id) },
            { $set: { status: 'picked_up', updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        if (!delivery) {
            return res.status(409).json({
                statusCode: 409,
                statusMessage: 'Delivery not found, not assigned to you, or not ready for pickup.',
                content: {}
            });
        }

        return res.status(200).json({
            statusCode: 200,
            statusMessage: 'Delivery picked up successfully.',
            content: delivery
        });

    } catch (error) {
        console.error('Failed to pick up delivery:', error);

        return res.status(500).json({
            statusCode: 500,
            statusMessage: 'Failed to pick up delivery.',
            content: {}
        });
    }
});
export default router;
