import { useState } from "react";
import axios from "axios";
import { Button, Input, Label, TextField } from "@heroui/react";
import "../css/newrequest.css";

// Temporary list until the /api/buildings endpoint is ready
const BUILDINGS = [
  { id: "b1", name: "Boreham Library" },
  { id: "b2", name: "Smith-Pendergraft Campus Center" },
  { id: "b3", name: "Lion's Den" },
  { id: "b4", name: "Sebastian Commons" },
];

export default function NewRequest() {
  const [item, setItem] = useState("");
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [tip, setTip] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const sameBuilding = pickup !== "" && pickup === delivery;

  const isValid =
    item.trim() !== "" &&
    pickup !== "" &&
    delivery !== "" &&
    !sameBuilding &&
    tip !== "" &&
    Number(tip) >= 0;

  async function handleSubmit() {
    const request = {
      item: item.trim(),
      pickupLocation: pickup,
      deliveryLocation: delivery,
      tipAmount: Math.round(Number(tip) * 100), // dollars to cents
    };

    try {
      const res = await axios.post("/api/v1/deliveries", request);
      console.log("Saved:", res.data);
      setIsError(false);
      setMessage("Request submitted! A courier will pick it up soon.");
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.error || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="newrequest-page">
      <div className="newrequest-card">
        <div className="newrequest-header">
          <h1 className="newrequest-title">New Delivery Request</h1>
          <p className="newrequest-subtitle">
            Tell a courier what you need and where to bring it.
          </p>
        </div>

        <div className="newrequest-form">
          <TextField name="item" value={item} onChange={setItem}>
            <Label>What do you need?</Label>
            <Input className="newrequest-input" placeholder="Large iced coffee from the Union" />
          </TextField>

          <div className="newrequest-row">
            <label className="newrequest-label">
              Pickup location
              <select
                className="newrequest-select"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              >
                <option value="">Choose a building</option>
                {BUILDINGS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>

            <label className="newrequest-label">
              Delivery location
              <select
                className="newrequest-select"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
              >
                <option value="">Choose a building</option>
                {BUILDINGS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
          </div>

          {sameBuilding && (
            <p className="newrequest-error">Pickup and delivery must be different buildings.</p>
          )}

          <div>
            <TextField name="tip" type="number" value={tip} onChange={setTip}>
              <Label>Tip ($)</Label>
              <Input className="newrequest-input" placeholder="3.00" />
            </TextField>
            <p className="newrequest-hint">Couriers see this when choosing deliveries.</p>
          </div>

          <Button
            variant="primary"
            className="newrequest-submit"
            isDisabled={!isValid}
            onPress={handleSubmit}
          >
            Submit Request
          </Button>

          {message && (
            <p className={isError ? "newrequest-error" : "newrequest-success"}>{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}