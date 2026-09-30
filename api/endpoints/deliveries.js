import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
const router = express.Router();
// Creates a new delivery request.
router.post('/', async (req, res) => {

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
export default router;
