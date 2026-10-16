import test from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateDistance,
    sortRequestsByDistance,
    isValidCoordinates
} from './closestLocation.js';

// Closest to My Location: Identical GPS points should have zero distance.
test('returns zero when both locations are identical', () => {
    const distance = calculateDistance(35.38, -94.37, 35.38, -94.37);

    assert.equal(distance, 0);
});

// Closest to My Location: Verify a known distance along the equator.
test('calculates approximately 111.2 km for one degree of longitude at the equator', () => {
    const distance = calculateDistance(0, 0, 0, 1);

    // Expected distance is approximately 111,195 meters.
    assert.ok(Math.abs(distance - 111195) < 100);
});

// Closest to My Location: Distance should be the same in both directions.
test('returns the same distance when locations are reversed', () => {
    const forward = calculateDistance(35.38, -94.37, 35.39, -94.36);
    const backward = calculateDistance(35.39, -94.36, 35.38, -94.37);

    assert.ok(Math.abs(forward - backward) < 0.000001);
});
// Closest to My Location: Verify requests are sorted by nearest pickup.
test('sorts delivery requests from closest to farthest', () => {
    // Courier's current location (example coordinates).
    const courierLocation = {
        latitude: 35.38,
        longitude: -94.37
    };

    // Example campus locations with different distances.
    const locations = [
        { name: 'Building A', latitude: 35.39, longitude: -94.37 },
        { name: 'Building B', latitude: 35.381, longitude: -94.37 },
        { name: 'Building C', latitude: 35.40, longitude: -94.37 }
    ];

    // Requests are intentionally not ordered by distance.
    const requests = [
        { _id: '1', pickupLocation: 'Building A' },
        { _id: '2', pickupLocation: 'Building C' },
        { _id: '3', pickupLocation: 'Building B' }
    ];

    const sorted = sortRequestsByDistance(
        requests,
        locations,
        courierLocation
    );

    // Building B is nearest, followed by A, then C.
    assert.deepEqual(
        sorted.map(request => request._id),
        ['3', '1', '2']
    );

    // Every result should contain a calculated distance.
    assert.ok(sorted.every(request =>
        Number.isFinite(request.distanceMeters)
    ));
});

// Closest to My Location: Requests with unknown pickup coordinates go last.
test('places requests with missing pickup coordinates last', () => {
    const courierLocation = {
        latitude: 35.38,
        longitude: -94.37
    };

    const locations = [
        {
            name: 'Building A',
            latitude: 35.381,
            longitude: -94.37
        }
    ];

    const requests = [
        { _id: '1', pickupLocation: 'Unknown Building' },
        { _id: '2', pickupLocation: 'Building A' }
    ];

    const sorted = sortRequestsByDistance(
        requests,
        locations,
        courierLocation
    );

    // Known building comes first.
    assert.deepEqual(
        sorted.map(request => request._id),
        ['2', '1']
    );

    // Unknown building has no calculated distance.
    assert.equal(sorted[1].distanceMeters, null);
});
// Closest to My Location: Sorting must not modify the original requests.
test('preserves the original requests and their order', () => {
    const courierLocation = {
        latitude: 35.38,
        longitude: -94.37
    };

    const locations = [
        { name: 'Far Building', latitude: 35.40, longitude: -94.37 },
        { name: 'Near Building', latitude: 35.381, longitude: -94.37 }
    ];

    const requests = [
        { _id: '1', pickupLocation: 'Far Building' },
        { _id: '2', pickupLocation: 'Near Building' }
    ];

    const originalRequests = structuredClone(requests);

    const sorted = sortRequestsByDistance(
        requests,
        locations,
        courierLocation
    );

    // Verify the returned requests are sorted nearest first.
    assert.deepEqual(
        sorted.map(request => request._id),
        ['2', '1']
    );

    // Verify the original array and objects remain unchanged.
    assert.deepEqual(requests, originalRequests);
    assert.notStrictEqual(sorted, requests);
    assert.notStrictEqual(sorted[0], requests[1]);
});
// Closest to My Location: Reject coordinates outside valid GPS ranges.
test('rejects invalid latitude and longitude values', () => {
    assert.equal(isValidCoordinates(35.38, -94.37), true);

    assert.equal(isValidCoordinates(120, -94.37), false);
    assert.equal(isValidCoordinates(35.38, -200), false);
    assert.equal(isValidCoordinates(NaN, -94.37), false);
    assert.equal(isValidCoordinates(35.38, Infinity), false);
});

// Closest to My Location: Invalid pickup coordinates must not produce a distance.
test('places requests with invalid pickup coordinates last', () => {
    const courierLocation = {
        latitude: 35.38,
        longitude: -94.37
    };

    const locations = [
        { name: 'Invalid Building', latitude: 120, longitude: -94.37 },
        { name: 'Valid Building', latitude: 35.381, longitude: -94.37 }
    ];

    const requests = [
        { _id: '1', pickupLocation: 'Invalid Building' },
        { _id: '2', pickupLocation: 'Valid Building' }
    ];

    const sorted = sortRequestsByDistance(
        requests,
        locations,
        courierLocation
    );

    // Valid building comes first.
    assert.deepEqual(
        sorted.map(request => request._id),
        ['2', '1']
    );

    // Invalid building must not have a calculated distance.
    assert.equal(sorted[1].distanceMeters, null);
});
// Closest to My Location: Invalid courier GPS must stop distance sorting.
test('rejects invalid courier GPS coordinates', () => {
    const requests = [
        { _id: '1', pickupLocation: 'Building A' }
    ];

    const locations = [
        { name: 'Building A', latitude: 35.38, longitude: -94.37 }
    ];

    const invalidCourierLocation = {
        latitude: 120,
        longitude: -94.37
    };

    assert.throws(
        () => sortRequestsByDistance(
            requests,
            locations,
            invalidCourierLocation
        ),
        /Valid courier GPS coordinates are required/
    );
});