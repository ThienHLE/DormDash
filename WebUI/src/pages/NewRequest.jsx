import { useState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { createDelivery, getCurrentUser } from "../api/API.js";
import "../css/newrequest.css";

// Temporary list until there's a buildings endpoint
const BUILDINGS = [
  "Boreham Library",
  "Smith-Pendergraft Campus Center",
  "Lion's Den",
  "Sebastian Commons",
];

export default function NewRequest() {
  const [item, setItem] = useState("");
  const [instructions, setInstructions] = useState("");
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [tip, setTip] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sameBuilding = pickup !== "" && pickup === delivery;

  const isValid =
    item.trim() !== "" &&
    pickup !== "" &&
    delivery !== "" &&
    !sameBuilding &&
    tip !== "" &&
    Number(tip) >= 0;

  function resetForm() {
    setItem("");
    setInstructions("");
    setPickup("");
    setDelivery("");
    setTip("");
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessage("");

    try {
      const user = await getCurrentUser();
      if (!user) {
        setIsError(true);
        setMessage("Please log in before creating a request.");
        return;
      }

      await createDelivery({
        requesterId: user._id ?? user.id,
        item: item.trim(),
        instructions: instructions.trim(),
        pickupLocation: pickup,
        deliveryLocation: delivery,
        tip: Math.round(Number(tip) * 100), // dollars to cents
      });

      setIsError(false);
      setMessage("Request submitted! A courier will pick it up soon.");
      resetForm();
    } catch (error) {
      setIsError(true);
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
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
                {BUILDINGS.map((name) => (
                  <option key={name} value={name}>{name}</option>
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
                {BUILDINGS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>

          {sameBuilding && (
            <p className="newrequest-error">Pickup and delivery must be different buildings.</p>
          )}

          <label className="newrequest-label">
            Instructions (optional)
            <textarea
              className="newrequest-select"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Room 214, knock twice"
            />
          </label>

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
            isDisabled={!isValid || isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>

          {message && (
            <p className={isError ? "newrequest-error" : "newrequest-success"}>{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}