import { useState, useEffect } from "react";
import { Button, Modal } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import {
    getRequests,
    acceptRequest,
    getMyRequests,
    getCurrentUser,
    getMyDisputes,
    pickUpDelivery,
    getCampusLocations
} from "../api/API.js";
import { BUILDINGS } from "../constants/buildings.js";
import { TIP_RANGES } from "../constants/tipRanges.js";
import ReportDeliveryButton from "../components/ReportDeliveryButton.jsx";
import "../css/styling.css";
// Closest to My Location: Distance sorting and GPS coordinate validation.
import {
    sortRequestsByDistance,
    isValidCoordinates
} from "../utils/closestLocation.js";

function Dashboard() {
    const navigate = useNavigate();
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requests, setRequests] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [reportedPostIds, setReportedPostIds] = useState([]);
    const [reportDataLoaded, setReportDataLoaded] = useState(false);
    const [reportCheckError, setReportCheckError] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [location, setLocation] = useState("");
    const [tipRange, setTipRange] = useState("");
    const [sort, setSort] = useState("");               //tip:desc
    // Closest to My Location: Track the sorting mode currently applied to results.
    const [appliedSort, setAppliedSort] = useState("");
    const [loadError, setLoadError] = useState("");
    const [gpsError, setGpsError] = useState("");
    // Closest to My Location: Request the courier's current GPS position.
    function getCourierGPS() {
        return new Promise((resolve, reject) => {
            // Check whether the browser supports geolocation.
            if (!navigator.geolocation) {
                reject(new Error("Your browser does not support GPS location."));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    // Reject invalid coordinates before calculating distances.
                    if (!isValidCoordinates(latitude, longitude)) {
                        reject(new Error("Invalid GPS coordinates received."));
                        return;
                    }

                    resolve({ latitude, longitude });
                },
                (error) => {
                    if (error.code === 1) {
                        reject(new Error("Location permission denied. Please enable location access."));
                    } else {
                        reject(new Error("Unable to get your current location. Please try again."));
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    //US-08: Turn the dropdown values into the body the API expect. Tip range in cents. 
    function buildFilters() {
        const { tipMin, tipMax } = TIP_RANGES[tipRange];
        const filters = {};
        if (location) filters.location = location;
        if (tipMin !== undefined) filters.tipMin = tipMin;
        if (tipMax !== undefined) filters.tipMax = tipMax;
        // Closest to My Location: Handle distance sorting in the frontend,
        // while keeping the existing US-08 backend sorting unchanged.
        if (sort && sort !== "closest") {
            const [sortBy, sortOrder] = sort.split(":");
            filters.sortBy = sortBy;
            filters.sortOrder = sortOrder;
        }
        return filters;
    }


    // US-08 / Closest to My Location: Load requests and reset previous GPS sorting.
    async function loadRequests(filters = {}) {
        // These results have not been sorted by GPS distance.
        setAppliedSort("");
        setGpsError("");

        try {
            setLoadError("");
            setRequests(await getRequests(filters));
        } catch {
            setRequests([]);
            setLoadError("Could not load requests. Try again.");
        }
    }

    // Closest to My Location: Apply existing filters and optionally sort by GPS distance.
    async function applyFilters() {
        setGpsError("");

        // Keep the original US-08 behavior for other sorting options.
        // Closest to My Location: Reset GPS sorting when using regular US-08 filters.
        if (sort !== "closest") {
            setAppliedSort("");
            await loadRequests(buildFilters());
            return;
        }

        try {
            // Ask for GPS only when the user selects Closest to My Location.
            const position = await getCourierGPS();


            // Retrieve active campus buildings and available requests.
            const [locations, availableRequests] = await Promise.all([
                getCampusLocations(),
                getRequests(buildFilters())
            ]);

            // Sort the requests by distance to their pickup locations.
            const sortedRequests = sortRequestsByDistance(
                availableRequests,
                locations,
                position
            );

            setRequests(sortedRequests);
            // Closest to My Location: Mark distance sorting as successfully applied.
            setAppliedSort("closest");

            setLoadError("");

        } catch (error) {
            // Closest to My Location: Do not display old results as closest-first results.
            setRequests([]);
            setAppliedSort("");
            setGpsError(error.message || "Unable to sort requests by location.");
        }
    }

    // Closest to My Location: Reset all filters and GPS-related state.
    function clearFilters() {
        setLocation("");
        setTipRange("");
        setSort("");
        setAppliedSort("");
        setGpsError("");
        loadRequests();
    }

    useEffect(() => {
        // US-08 / Closest to My Location:
        // Load initial requests asynchronously when Dashboard opens.
        getRequests()
            .then((data) => {
                setRequests(data);
                setLoadError("");
            })
            .catch(() => {
                setRequests([]);
                setLoadError("Could not load requests. Try again.");
            });

        getCurrentUser().then(async (user) => {
            setCurrentUser(user);
            if (!user) return;
            const [deliveriesResult, disputesResult] = await Promise.allSettled([
                getMyRequests(user._id),
                getMyDisputes()
            ]);
            if (deliveriesResult.status === "fulfilled") {
                setMyRequests(deliveriesResult.value);
            } else {
                setLoadError(deliveriesResult.reason.message);
            }
            if (disputesResult.status === "fulfilled") {
                setReportedPostIds(disputesResult.value
                    .filter((dispute) => String(dispute.createdBy) === String(user._id))
                    .map((dispute) => String(dispute.postId)));
                setReportDataLoaded(true);
            } else {
                setReportCheckError(disputesResult.reason.message);
            }
        });
    }, []);

    async function registerRequest() {
        if (!selectedRequest || !currentUser) {
            return;
        }

        await acceptRequest(
            selectedRequest._id,
            currentUser._id
        );

        setSelectedRequest(null);

        loadRequests(buildFilters());

        {/*getRequests().then((data) => {
            setRequests(data);
        });*/}

        getMyRequests(currentUser._id).then((data) => {
            setMyRequests(data);
        });
    }

    async function pickUpRequest(request) {
        if (!request || !currentUser) {
            return;
        }

        await pickUpDelivery(request._id);

        setSelectedRequest(null);

        getMyRequests(currentUser._id).then((data) => {
            setMyRequests(data);
        });
    }

    function getStatusLabel(status) {
        if (status === "accepted") {
            return "Accepted";
        }

        if (status === "picked_up") {
            return "Picked Up";
        }

        if (status === "delivered") {
            return "Delivered";
        }

        return status;
    }

    const availableRequests = requests.filter((request) => {
        if (!currentUser) {
            return true;
        }

        return String(request.requesterId) !== String(currentUser._id);
    });

    const activeDeliveries = myRequests.filter((request) => {
        return request.status === "accepted" || request.status === "picked_up";
    });

    return (
        <div className="page">
            <div className="page-content">
                <h1>Available Requests</h1>

                {/*US-08: filter available requests by building and tip */}
                <div className="mx-6 flex flex-wrap items-end gap-4 
                                rounded-2xl border border-border bg-surface p-5 shadow-sm">
                    <label className="form-label">
                        Building
                        <select className="form-select" value={location}
                            onChange={(e) => setLocation(e.target.value)}>
                            <option value="">All Buildings</option>
                            {BUILDINGS.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </label>


                    <label className="form-label">
                        Tip
                        <select className="form-select" value={tipRange}
                            onChange={(e) => setTipRange(e.target.value)}>
                            {Object.entries(TIP_RANGES).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="form-label">
                        Sort by
                        <select className="form-select" value={sort}
                            onChange={(e) => setSort(e.target.value)}>
                            <option value="">Default</option>
                            <option value="tip:desc">Tip : high to low</option>
                            <option value="tip:asc">Tip : low to high</option>
                            <option value="pickupLocation:asc">Pickup location : A-Z</option>
                            <option value="pickupLocation:desc">Pickup location : Z-A</option>
                            {/*<option value="deliveryLocation:asc">Delivery location : A-Z</option>
                        <option value="deliveryLocation:desc">Delivery location : Z-A</option>*/}
                            {/* Closest to My Location: Sort available requests by courier GPS distance. */}
                            <option value="closest">Closest to My Location</option>
                        </select>
                    </label>

                    <div className="ml-auto flex gap-3">
                        <Button variant="primary" className="bg-primary text-white"
                            onPress={applyFilters}>Apply</Button>
                        <Button variant="secondary" onPress={clearFilters}>Clear</Button>
                    </div>
                </div>

                {loadError && (<div className="mx-6 mt-4 rounded-xl border border-red-200
               bg-red-50 p-4 text-sm text-red-700">
                    {loadError}
                </div>)}

                {/* Closest to My Location: Show empty results only when no error occurred. */}
                {!loadError && !gpsError && availableRequests.length === 0 && (
                    <div className="py-12 text-center text-muted">
                        No requests match your filters.
                    </div>
                )}
                {/* Closest to My Location: Display GPS or campus-location errors. */}
                {gpsError && (
                    <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {gpsError}
                    </div>
                )}

                {/*--------- END OF US-08 FILTERS ----------------------------------------------------*/}

                <div className="cards">
                    {availableRequests.map((request) => (
                        <div className="card" key={request._id}>
                            <h2 className="card-title">
                                {request.item}
                            </h2>

                            <div className="card-description">
                                <p>
                                    <strong>Pick up location: </strong>
                                    {request?.pickupLocation}
                                </p>
                                {/* Closest to My Location: Display straight-line distance to pickup. */}
                                {appliedSort === "closest" && request.distanceMeters !== undefined && (
                                    <p>
                                        <strong>Pickup distance: </strong>
                                        {Number.isFinite(request.distanceMeters)
                                            ? `${Math.round(request.distanceMeters)} m (straight-line)`
                                            : "Unavailable"}
                                    </p>
                                )}

                                <p>
                                    <strong>Delivery location: </strong>
                                    {request?.deliveryLocation}
                                </p>

                                <p>
                                    <strong>Tip: </strong>
                                    ${(request.tip / 100).toFixed(2)}
                                </p>
                            </div>

                            <Button
                                onPress={() => setSelectedRequest(request)}
                            >
                                View Request
                            </Button>
                        </div>
                    ))}
                </div>

                <h1>Active Deliveries</h1>

                {activeDeliveries.length === 0 &&
                    (<div className="py-12 text-center text-muted">You have no active deliveries.</div>)}

                {reportCheckError && (
                    <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        Could not check your previous reports: {reportCheckError}
                    </div>
                )}

                <div className="cards">
                    {activeDeliveries.map((request) => (
                        <div className="card" key={request._id}>
                            <h2 className="card-title">
                                {request.item}
                            </h2>

                            <div className="card-description">
                                <p>
                                    <strong>Pick up location: </strong>
                                    {request?.pickupLocation}
                                </p>

                                <p>
                                    <strong>Delivery location: </strong>
                                    {request?.deliveryLocation}
                                </p>

                                <p>
                                    <strong>Status: </strong>
                                    {getStatusLabel(request.status)}
                                </p>
                            </div>

                            <Button
                                onPress={() => setSelectedRequest(request)}
                            >
                                View Request
                            </Button>

                            {request.status === "accepted" && (
                                <Button
                                    variant="primary"
                                    onPress={() => pickUpRequest(request)}
                                >
                                    Picked Up
                                </Button>
                            )}

                            {request.status === "picked_up" && (
                                <Button
                                    variant="primary"
                                    onPress={() => navigate(`/deliveries/${request._id}/confirm`)}
                                >
                                    Confirm delivery
                                </Button>
                            )}

                            <ReportDeliveryButton
                                delivery={request}
                                currentUserId={currentUser?._id}
                                hasReported={reportedPostIds.includes(String(request._id))}
                                reportDataLoaded={reportDataLoaded}
                            />

                        </div>
                    ))}
                </div>

                <Modal>
                    <Modal.Backdrop
                        isOpen={selectedRequest !== null}
                        onOpenChange={(isOpen) => {
                            if (!isOpen) {
                                setSelectedRequest(null);
                            }
                        }}
                    >
                        <Modal.Container>
                            <Modal.Dialog>

                                <Modal.Header>
                                    <Modal.Heading>
                                        {selectedRequest?.item}
                                    </Modal.Heading>
                                </Modal.Header>

                                <Modal.Body>
                                    <p>
                                        <strong>Instructions:</strong>{" "}
                                        {selectedRequest?.instructions}
                                    </p>

                                    <p>
                                        <strong>Pickup location:</strong>{" "}
                                        {selectedRequest?.pickupLocation}
                                    </p>

                                    <p>
                                        <strong>Delivery location:</strong>{" "}
                                        {selectedRequest?.deliveryLocation}
                                    </p>

                                    <p>
                                        <strong>Tip:</strong>{" "}
                                        ${(selectedRequest?.tip / 100).toFixed(2)}
                                    </p>

                                    <p>
                                        <strong>Status:</strong>{" "}
                                        {getStatusLabel(selectedRequest?.status)}
                                    </p>
                                </Modal.Body>

                                <Modal.Footer>
                                    {selectedRequest?.status === "open" && (
                                        <Button
                                            onPress={registerRequest}
                                        >
                                            Accept Request
                                        </Button>
                                    )}

                                    {selectedRequest?.status === "accepted" && (
                                        <Button
                                            onPress={() => pickUpRequest(selectedRequest)}
                                        >
                                            Picked Up
                                        </Button>
                                    )}

                                    {selectedRequest?.status === "picked_up" && (
                                        <Button
                                            onPress={() => navigate(`/deliveries/${selectedRequest._id}/confirm`)}
                                        >
                                            Confirm delivery
                                        </Button>
                                    )}

                                    <Button
                                        variant="secondary"
                                        onPress={() => setSelectedRequest(null)}
                                    >
                                        Close
                                    </Button>
                                </Modal.Footer>
                            </Modal.Dialog>
                        </Modal.Container>
                    </Modal.Backdrop>
                </Modal>
            </div>
        </div>
    );
}

export default Dashboard