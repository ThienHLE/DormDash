import express from 'express';
const router = express.Router();
// Creates a new delivery request.
router.post('/', async (req, res) => {

    // Gets the delivery information sent by the frontend.
    const {
        item,
        pickupLocation,
        deliveryLocation,
        tipAmount
    } = req.body;

    // Checks that all required delivery information was provided.
if (!item || !pickupLocation || !deliveryLocation || tipAmount === undefined) {
    return res.status(400).json({
        error: 'Item, pickup location, delivery location, and tip amount are required.'
    });
}

// Checks that the tip is a valid non-negative number.
if (typeof tipAmount !== 'number' || tipAmount < 0) {
    return res.status(400).json({
        error: 'Tip amount must be a non-negative number.'
    });
}
    //  test the endpoint before connecting it to MongoDB.
    res.status(200).json({
        item,
        pickupLocation,
        deliveryLocation,
        tipAmount
    });
});
export default router;
