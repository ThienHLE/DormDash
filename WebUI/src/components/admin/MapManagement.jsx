import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
    getLocations,
    createLocation,
    deleteLocation
} from "../../api/API";

function MapManagement() {
    const [status, setStatus] = useState("Loading locations...");

    useEffect(() => {

        // Create the map
        const map = L.map("map", {
            minZoom: 16,
            maxZoom: 18
        }).setView([35.3825, -94.3750], 17);

        // Add OpenStreetMap
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);

        // Create the map boundaries
        const bounds = L.latLngBounds(
            [35.3680, -94.3920],
            [35.3970, -94.3580]
        );

        map.setMaxBounds(bounds);


        // Create a marker for a location
        function addLocationMarker(location) {

            const marker = L.marker([
                location.latitude,
                location.longitude
            ]).addTo(map);


            // Create the popup
            const popup = document.createElement("div");

            const name = document.createElement("strong");
            name.textContent = location.name;

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";

            deleteButton.style.display = "block";
            deleteButton.style.marginTop = "10px";


            // Put the name and button inside popup
            popup.appendChild(name);
            popup.appendChild(deleteButton);

            marker.bindPopup(popup);


            // Delete marker when button is clicked
            deleteButton.addEventListener("click", async function () {

                try {

                    await deleteLocation(location._id);

                    // Remove marker from map
                    map.removeLayer(marker);

                    setStatus(
                        location.name + " was deleted."
                    );

                } catch (error) {

                    console.log(error);

                    setStatus(
                        "Unable to delete location."
                    );
                }
            });
        }


        // Load all locations from MongoDB
        async function loadLocations() {
            try {
                const locations = await getLocations();
                // Create a marker for every location
                locations.forEach(function (location) {
                    addLocationMarker(location);
                });
                setStatus("Locations loaded.");

            } catch (error) {
                console.log(error);
                setStatus(
                    "Unable to load locations."
                );
            }
        }

        // Double-click the map to create a location
        map.on("dblclick", async function (event) {

            // Ask the user for the name
            const name = prompt(
                "Enter the name of this location:"
            );

            // Stop if they cancel
            if (name === null) {
                return;
            }

            // Stop if they entered nothing
            if (name.trim() === "") {
                alert("Location name cannot be empty.");
                return;
            }

            try {

                // Save the location to MongoDB
                const location = await createLocation(
                    name.trim(),
                    event.latlng.lat,
                    event.latlng.lng
                );

                // Immediately add the new marker
                addLocationMarker(location);

                setStatus(
                    location.name + " was created."
                );

            } catch (error) {

                console.log(error);

                // If the name already exists
                if (
                    error.response &&
                    error.response.status === 409
                ) {
                    alert(
                        "A location with this name already exists."
                    );
                } else {
                    setStatus(
                        "Unable to create location."
                    );
                }
            }
        });

        // Load the existing locations
        loadLocations();

        // Remove the map when leaving the page
        return () => {
            map.remove();
        };
    }, []);


    return (
        <div className="page">

            <div className="page-content">

                <h1>Map Management</h1>

                <p className="mt-2 text-muted">
                    Double-click the map to create a location.
                    Click a marker to view its name and delete it.
                </p>

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

export default MapManagement