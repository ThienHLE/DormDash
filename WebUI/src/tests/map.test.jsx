import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import { render, waitFor, cleanup, act } from '@testing-library/react';
import Map from '../pages/Map.jsx';

// Creates fake API functions for the map tests.
const {
    mockGetLocations,
    mockGetMyDeliveries,
    mockGetCarrierLocation,
    mockMarkers
} = vi.hoisted(() => ({
    mockGetLocations: vi.fn(),
    mockGetMyDeliveries: vi.fn(),
    mockGetCarrierLocation: vi.fn(),
    mockMarkers: []
}));

// Stores the automatic carrier update function.
let mockTrackingCallback;

// Mocks the API functions used by Map.jsx.
vi.mock('../api/API.js', () => ({
    getLocations: mockGetLocations,
    getMyDeliveries: mockGetMyDeliveries,
    getCarrierLocation: mockGetCarrierLocation
}));

// Mocks Leaflet so tests do not need a real map.

vi.mock('leaflet', () => {
    const mockMap = {
        setView: vi.fn(),
        setMaxBounds: vi.fn(),
        remove: vi.fn()
    };

    mockMap.setView.mockReturnValue(mockMap);

    const mockMarker = vi.fn(() => {
        const marker = {
            addTo: vi.fn(),
            bindPopup: vi.fn(),
            setLatLng: vi.fn()
        };

        marker.addTo.mockReturnValue(marker);
        marker.bindPopup.mockReturnValue(marker);

        mockMarkers.push(marker);

        return marker;
    });

    return {
        default: {
            map: vi.fn(() => mockMap),
            tileLayer: vi.fn(() => ({
                addTo: vi.fn()
            })),
            latLngBounds: vi.fn(),
            divIcon: vi.fn(),
            marker: mockMarker
        }
    };
});


// Imports the mocked Leaflet module.
import L from 'leaflet';

describe('Map tests', () => {

    // Resets the fake functions before each test.
    beforeEach(() => {
        vi.clearAllMocks();
        mockMarkers.length = 0;
        mockTrackingCallback = undefined;

        // Captures the callback used to refresh carrier locations.
        vi.spyOn(globalThis, 'setInterval').mockImplementation(
            (callback) => {
                mockTrackingCallback = callback;
                return 1;
            }
        );
    });

    // Cleans up the rendered map after each test.
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    // Tests that campus locations appear on the map.
    it('creates campus markers', async () => {
        mockGetLocations.mockResolvedValue([
            {
                name: 'Library',
                latitude: 35.3825,
                longitude: -94.3750
            }
        ]);

        mockGetMyDeliveries.mockResolvedValue([]);

        render(<Map />);

        await waitFor(() => {
            expect(L.marker).toHaveBeenCalledWith([
                35.3825,
                -94.3750
            ]);
        });
    });

    // Tests that pickup and drop-off markers use the correct coordinates.
    it('creates pickup and dropoff markers', async () => {
        mockGetLocations.mockResolvedValue([
            {
                name: 'Student Center',
                latitude: 35.38,
                longitude: -94.37
            },
            {
                name: 'Library',
                latitude: 35.39,
                longitude: -94.36
            }
        ]);

        mockGetMyDeliveries.mockResolvedValue([
            {
                item: 'Coffee',
                pickupLocation: 'Student Center',
                deliveryLocation: 'Library',
                status: 'open'
            }
        ]);

        render(<Map />);

        await waitFor(() => {
            expect(L.marker).toHaveBeenCalledWith([35.38, -94.37]);
            expect(L.marker).toHaveBeenCalledWith([35.39, -94.36]);

            // Two campus markers plus two delivery markers.
            expect(L.marker).toHaveBeenCalledTimes(4);
        });
    });

    // Tests that the map displays its successful loading message.
    it('loads the map successfully', async () => {
        mockGetLocations.mockResolvedValue([]);
        mockGetMyDeliveries.mockResolvedValue([]);

        const { getByText } = render(<Map />);

        await waitFor(() => {
            expect(getByText('Map loaded')).toBeTruthy();
        });
    });

    // Tests that the carrier marker moves when its location changes.
    it('updates the carrier marker location', async () => {
        mockGetLocations.mockResolvedValue([]);

        mockGetMyDeliveries.mockResolvedValue([
            {
                _id: '123',
                item: 'Coffee',
                status: 'accepted'
            }
        ]);

        mockGetCarrierLocation
            .mockResolvedValueOnce({
                location: {
                    latitude: 35.38,
                    longitude: -94.37
                }
            })
            .mockResolvedValueOnce({
                location: {
                    latitude: 35.39,
                    longitude: -94.36
                }
            });

        render(<Map />);

        await waitFor(() => {
            expect(mockGetCarrierLocation).toHaveBeenCalledWith('123');
            expect(mockMarkers).toHaveLength(1);
            expect(mockTrackingCallback).toBeDefined();
        });

        // Simulates the next automatic carrier location update.
        await act(async () => {
            mockTrackingCallback();
        });

        await waitFor(() => {
            expect(mockMarkers[0].setLatLng).toHaveBeenCalledWith([
                35.39,
                -94.36
            ]);
        });
    });

    // Tests that only accepted and picked-up deliveries are tracked.
    it('tracks only accepted or picked-up deliveries', async () => {
        mockGetLocations.mockResolvedValue([]);

        mockGetMyDeliveries.mockResolvedValue([
            { _id: '1', item: 'Coffee', status: 'accepted' },
            { _id: '2', item: 'Book', status: 'picked_up' },
            { _id: '3', item: 'Food', status: 'open' }
        ]);

        mockGetCarrierLocation.mockResolvedValue({
            location: {
                latitude: 35.38,
                longitude: -94.37
            }
        });

        render(<Map />);

        await waitFor(() => {
            expect(mockGetCarrierLocation).toHaveBeenCalledWith('1');
            expect(mockGetCarrierLocation).toHaveBeenCalledWith('2');
        });

        // Open deliveries should not have their carrier locations requested.
        expect(mockGetCarrierLocation).not.toHaveBeenCalledWith('3');
    });
});
