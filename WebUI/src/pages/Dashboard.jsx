import { useState, useEffect } from "react";
import { Button, Modal } from "@heroui/react";
import { getRequests, acceptRequest, getMyRequests, getCurrentUser } from "../api/API.js";
import "../css/styling.css";

function Dashboard() {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requests, setRequests] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        getRequests().then((data) => {
            setRequests(data);
        });

        getCurrentUser().then((user) => {
            setCurrentUser(user);

            getMyRequests(user._id).then((data) => {
                setMyRequests(data);
            });
        });
    }, []);

    async function registerRequest(){
        if(!selectedRequest || !currentUser){
            return;
        }

        await acceptRequest(
            selectedRequest._id,
            currentUser._id
        );

        setSelectedRequest(null);

        getRequests().then((data) => {
            setRequests(data);
        });

        getMyRequests(currentUser._id).then((data) => {
            setMyRequests(data);
        });
    }

    return (
        <div className="page">
            <div className="page-content">
                <h1>Open Requests</h1>

                <div className="cards">
                    {requests.map((request) => (
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
                            </div>

                            <Button
                                onPress={() => setSelectedRequest(request)}
                            >
                                View Request
                            </Button>
                        </div>
                    ))}
                </div>

            <h1>My Requests</h1>
                <div className="cards">
                    {myRequests.map((request) => (
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
                            </div>

                            <Button
                                onPress={() => setSelectedRequest(request)}
                            >
                                View Request
                            </Button>
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
                                        ${selectedRequest?.tip/100}
                                    </p>

                                    <p>
                                        <strong>Status:</strong>{" "}
                                        {selectedRequest?.status}
                                    </p>
                                </Modal.Body>

                                <Modal.Footer>
                                    <Button
                                        onPress={registerRequest}
                                    >
                                        Register
                                    </Button>

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