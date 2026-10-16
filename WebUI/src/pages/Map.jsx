import { useEffect, useState, useRef } from "react"; // Estimated Delivery Time: Import useRef to track the latest API request and ignore outdated responses.
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../utils/leafletIcons";
import {
    getLocations,
    getMyDeliveries,
    getCarrierLocation,
    //for Estimated Delivery Time
    getDeliveryWalkingRoute
} from "../api/API";
// Estimated Delivery Time: Convert walking duration from seconds to minutes.
import { calculateEstimatedMinutes } from "../utils/estimatedDeliveryTime.js";

function Map() {

    const [status, setStatus] = useState("Loading map...");
    // Estimated Delivery Time: Store deliveries and the selected delivery.
    const [deliveries, setDeliveries] = useState([]);
    const [selectedDeliveryId, setSelectedDeliveryId] = useState("");

    // Store the estimated walking time and API request status.
    const [estimatedMinutes, setEstimatedMinutes] = useState(null);
    const [etaLoading, setEtaLoading] = useState(false);
    const [etaError, setEtaError] = useState("");
    // Estimated Delivery Time: Identify the latest API request.
    const etaRequestId = useRef(0);

    // Estimated Delivery Time: Retrieve walking time for the selected delivery.
    async function loadEstimatedTime(deliveryId) {
        // Give each selection a unique request number.
        const requestId = ++etaRequestId.current;

        setEstimatedMinutes(null);
        setEtaError("");

        if (!deliveryId) {
            setEtaLoading(false);
            return;
        }

        setEtaLoading(true);

        try {
            const result = await getDeliveryWalkingRoute(deliveryId);

            // Ignore responses from older selections.
            if (requestId !== etaRequestId.current) return;

            const minutes = calculateEstimatedMinutes(
                result.route?.durationSeconds
            );

            if (minutes === null) {
                throw new Error("Estimated walking time is unavailable.");
            }

            setEstimatedMinutes(minutes);
        } catch (error) {
            // Ignore errors from older requests.
            if (requestId !== etaRequestId.current) return;

            setEtaError(
                error.message || "Could not retrieve estimated walking time."
            );
        } finally {
            // Only the latest request can change the loading state.
            if (requestId === etaRequestId.current) {
                setEtaLoading(false);
            }
        }
    }


    useEffect(() => {
        const map = L.map("map", {
            minZoom: 16,
            maxZoom: 18
        }).setView([35.3825, -94.3750], 17);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);

        const bounds = L.latLngBounds(
            [35.3680, -94.3920],
            [35.3970, -94.3580]
        );
        map.setMaxBounds(bounds);

        // Creating a marker for carrier
        const carrierIcon = L.divIcon({
            html: '<div style="font-size: 30px;">🚶‍♂️</div>',
            className: "carrier-icon",
            iconSize: [35, 35],
            iconAnchor: [17, 17]
        });
        
        // Stores the carrier markers
        const carrierMarkers = {};

        // Add a saved campus location
        function addLocationMarker(location) {
            L.marker([
                location.latitude,
                location.longitude
            ])
                .addTo(map)
                .bindPopup(location.name);
        }

        // Add a pickup or dropoff marker
        function addDeliveryMarker(location, message) {

            L.marker([
                location.latitude,
                location.longitude
            ])
                .addTo(map)
                .bindPopup(message);
        }

        // Get all campus locations
        async function loadLocations() {
            return await getLocations();
        }

        // Get all deliveries belonging to the logged-in user
        async function loadDeliveries() {
            return await getMyDeliveries();
        }

        // Update one carrier
        async function updateCarrier(delivery) {
            try {
                const result = await getCarrierLocation(
                    delivery._id
                );

                // No location has been sent yet
                if (!result.location) {
                    return;
                }

                const latitude = result.location.latitude;
                const longitude = result.location.longitude;

                // Create marker if it doesn't exist
                if (!carrierMarkers[delivery._id]) {
                    carrierMarkers[delivery._id] = L.marker([
                        latitude,
                        longitude
                        ],{ icon: carrierIcon })
                        .addTo(map)
                        .bindPopup(
                            "Carrier for: " + delivery.item
                        );

                } else {
                    // Move the carrier marker
                    carrierMarkers[delivery._id].setLatLng([
                        latitude,
                        longitude
                    ]);
                }

            } catch (error) {
                console.log(error);
            }
        }

        // Update all carrier locations
        async function updateCarriers(deliveries) {
            for (const delivery of deliveries) {
                if (delivery.status === "accepted" || delivery.status === "picked_up") {
                    await updateCarrier(delivery);
                }
            }
        }

        // Load the map
        async function startMap() {
            try {
                // Get locations
                const locations = await loadLocations();

                // Show all campus locations
                locations.forEach(function (location) {
                    addLocationMarker(location);
                });

                // Get the user's deliveries
                const deliveries = await loadDeliveries();
                // Estimated Delivery Time: Store deliveries for the selection dropdown.
                setDeliveries(deliveries);

                // Show pickup and dropoff markers
                deliveries.forEach(function (delivery) {
                    const pickup = locations.find(function (location) {
                        return location.name === delivery.pickupLocation;
                    });

                    const dropoff = locations.find(function (location) {
                        return location.name === delivery.deliveryLocation;
                    });

                    if (pickup) {
                        addDeliveryMarker(
                            pickup,
                            "Pickup: " + delivery.item
                        );
                    }

                    if (dropoff) {
                        addDeliveryMarker(
                            dropoff,
                            "Dropoff: " + delivery.item
                        );
                    }
                });

                // Get carrier locations immediately
                await updateCarriers(deliveries);

                setStatus("Map loaded");

                // Get carrier locations every 3 seconds
                const trackingTimer = setInterval(function () {
                    updateCarriers(deliveries);
                }, 3000);

                map.trackingTimer = trackingTimer;
            } catch (error) {
                console.log(error);
                setStatus("Unable to load map");
            }
        }

        startMap();

        // Cleanup
        return () => {
            if (map.trackingTimer) {
                clearInterval(map.trackingTimer);
            }

            map.remove();
        };
    }, []);

    return (
        <div className="page">
            <div className="page-content">
                <h1>Map</h1>
                {/* Estimated Delivery Time: Select a delivery and display walking time. */}
                <div className="mb-4 rounded-xl border border-border bg-surface p-4">
                    <h2>Estimated Delivery Time</h2>

                    <label htmlFor="eta-delivery" className="form-label">
                        Select a delivery
                    </label>

                    <select
                        id="eta-delivery"
                        className="form-select"
                        value={selectedDeliveryId}
                        onChange={(event) => {
                            const deliveryId = event.target.value;
                            setSelectedDeliveryId(deliveryId);
                            loadEstimatedTime(deliveryId);
                        }}
                    >
                        <option value="">Choose a delivery</option>

                        {deliveries.map((delivery) => (
                            <option key={delivery._id} value={delivery._id}>
                                {delivery.item} - {delivery.pickupLocation} to {delivery.deliveryLocation}
                            </option>
                        ))}
                    </select>

                    {etaLoading && <p>Calculating estimated walking time...</p>}

                    {!etaLoading && etaError && (
                        <p role="alert" className="text-red-600">
                            {etaError}
                        </p>
                    )}

                    {!etaLoading && !etaError && estimatedMinutes !== null && (
                        <p>
                            <strong>Estimated pickup-to-drop-off walking time: </strong>
                            {estimatedMinutes} {estimatedMinutes === 1 ? "minute" : "minutes"}
                        </p>
                    )}
                </div>
                <div
                    id="map"
                    style={{
                        height: "500px",
                        width: "100%"
                    }}
                ></div>

                <div
                    style={{
                        textAlign: "center",
                        marginTop: "15px"
                    }}
                >
                    {status}
                </div>
            </div>
        </div>
    );
}

export default Map