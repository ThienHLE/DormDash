import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
    getLocations,
    getMyDeliveries,
    getCarrierLocation
} from "../api/API";

function Map() {

    const [status, setStatus] = useState("Loading map...");

    useEffect(() => {
        const map = L.map("map", {
            minZoom: 10,
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
                    ])
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