import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import "../css/styling.css";

function Dashboard() {
  const [selectedRequest, setSelectedRequest] = useState(null);

  const requests = [
    {
      id: "6abc7391404cbdbb47921eb9",
      item: "Coffee",
      instructions: "No sugar",
      pickupLocation: "Student Center",
      deliveryLocation: "Library",
      tip: 300,
      status: "open",
    },
  ];

  return (
    <div className="page">
        <div className="page-content">
            <h1>Requests</h1>

            <div className="cards">
                {requests.map((request) => (
                    <div className="card" key={request.id}>
                        <h2 className="card-title">
                            {request.item}
                        </h2>

                        <p className="card-description">
                            <p>
                                <strong>Pick up location: </strong>{request?.pickupLocation}
                            </p>

                            <p>
                                <strong>Delivery location: </strong>{request?.deliveryLocation}
                            </p>
                        </p>

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
                                    onPress={() => {
                                    setSelectedRequest(null);
                                    }}
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