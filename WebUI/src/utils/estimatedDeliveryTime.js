// Estimated Delivery Time: Convert walking-route duration to minutes.
export function calculateEstimatedMinutes(durationSeconds) {
    // Reject invalid or negative durations.
    if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
        return null;
    }

    // Convert seconds to minutes and round up.
    return Math.ceil(durationSeconds / 60);
}