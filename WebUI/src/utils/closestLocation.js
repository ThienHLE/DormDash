// Closest to My Location: Calculate straight-line distance between two GPS points.

// Earth's approximate radius in meters.
const EARTH_RADIUS_METERS = 6371000;

// Convert degrees to radians because JavaScript trigonometry uses radians.
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
// Closest to My Location: Check whether GPS coordinates are valid.
export function isValidCoordinates(latitude, longitude) {
    return (
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180
    );
}

// Calculate the straight-line distance between two GPS locations.
export function calculateDistance(lat1, lon1, lat2, lon2) {
    // Difference between the two latitudes and longitudes.
    const latDifference = toRadians(lat2 - lat1);
    const lonDifference = toRadians(lon2 - lon1);

    // Haversine formula.
    const a =
        Math.sin(latDifference / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(lonDifference / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Return distance in meters.
    return EARTH_RADIUS_METERS * c;
}
// Closest to My Location: Sort requests from nearest to farthest pickup location.
export function sortRequestsByDistance(requests, locations, courierLocation) {
    // Closest to My Location: Reject invalid courier GPS coordinates.
    if (
        !courierLocation ||
        !isValidCoordinates(
            courierLocation.latitude,
            courierLocation.longitude
        )
    ) {
        throw new Error('Valid courier GPS coordinates are required.');
    }

    // Match each campus building name with its GPS coordinates.
    const locationMap = new Map(
        locations.map(location => [location.name, location])
    );

    // Calculate the distance from the courier to each pickup location.
    const requestsWithDistance = requests.map(request => {
        const pickup = locationMap.get(request.pickupLocation);

        // If pickup coordinates are unavailable, mark distance as unknown.
        // Closest to My Location: Ignore buildings with invalid GPS coordinates.
        if (
            !pickup ||
            !isValidCoordinates(pickup.latitude, pickup.longitude)
        ) {
            return { ...request, distanceMeters: null };
        }

        const distanceMeters = calculateDistance(
            courierLocation.latitude,
            courierLocation.longitude,
            pickup.latitude,
            pickup.longitude
        );

        return { ...request, distanceMeters };
    });

    // Sort nearest first and place unknown distances at the end.
    return requestsWithDistance.sort((a, b) =>
        (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)
    );
}