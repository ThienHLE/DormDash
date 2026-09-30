import express from 'express';
const router = express.Router();

router.get("/generateCode", (_req, res) => {
    // Verify user is NOT a driver.
    // Request object must pass in order id and user id
    // If checks out, generate code.
    // Save into database under confirmationCodes table.
});

router.post("/confirmCode", (_req, res) => {
    // Verify user is a driver.
    // Request object must pass in order id and user id

    // Compare orderId for match
    // Compare code table for order id and check if code passed in matches.

    // If match, return 200

    // If not match, return failure code
});

export default router;