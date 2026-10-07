import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function MapManagement() {
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
        

        return () => {
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

export default MapManagement