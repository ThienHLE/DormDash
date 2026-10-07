import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function Map() {
    const [status, setStatus] = useState("Checking carrier location...");

    //Initializing the map
    useEffect(() => {
        const map = L.map("map", {
            minZoom: 16,
            maxZoom: 18
        }).setView([35.3825, -94.3750], 17);
        
        //Putting the map onto the page
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);

        //Creating the border for the map
        const bounds = L.latLngBounds(
            [35.3680, -94.3920],
            [35.3970, -94.3580]
        );
        map.setMaxBounds(bounds);

        //Creating the Carrier Location Marker
        var carrierLocationMarker = null;

        map.locate({
            watch: true,
            enableHighAccuracy: true
        });

        map.on("locationfound", function (location) {

            //Checking to see if they are within the campus map bounds
            if (bounds.contains(location.latlng)) {

                setStatus("Carrier is on campus and headed to the drop off location!");
                if (carrierLocationMarker === null) {
                    carrierLocationMarker = L.marker(location.latlng)
                        .addTo(map)
                        .bindPopup("Carrier")
                        .openPopup();
                } else {
                    carrierLocationMarker.setLatLng(location.latlng);
                }

            } else {

                setStatus("Carrier is not on campus yet");
                if (carrierLocationMarker !== null) {
                    map.removeLayer(carrierLocationMarker);
                    carrierLocationMarker = null;
                }
            }
        });

        map.on("locationerror", function () {
            setStatus("Unable to find carrier location");
        });

        return () => {
            map.stopLocate();
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