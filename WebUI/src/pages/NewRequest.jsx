import { useState, useEffect } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { createDelivery, getCurrentUser, getCampusLocations } from "../api/API.js";
import "../css/newrequest.css";

export default function NewRequest() {
  const [buildings, setBuildings] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState("");
  const [item, setItem] = useState("");
  const [instructions, setInstructions] = useState("");
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [tip, setTip] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    let pending = false;
    async function loadLocations() {
      if (pending) return;
      pending = true;
      setLocationsLoading(true);
      try {
        const locations = await getCampusLocations();
        if (active) {
          setBuildings(locations.map((location) => location.name));
          setLocationsError("");
        }
      } catch (error) {
        if (active) {
          setBuildings([]);
          setLocationsError(error.message || "Could not load campus locations.");
        }
      } finally {
        pending = false;
        if (active) setLocationsLoading(false);
      }
    }
    void loadLocations();
    window.addEventListener("focus", loadLocations);
    return () => {
      active = false;
      window.removeEventListener("focus", loadLocations);
    };
  }, []);

  const sameBuilding = pickup !== "" && pickup === delivery;

  const isValid =
    item.trim() !== "" &&
    !locationsLoading &&
    buildings.includes(pickup) &&
    buildings.includes(delivery) &&
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
    if (!isValid || isSubmitting) return;
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
          {locationsError && <p role="alert" className="newrequest-error">{locationsError}</p>}
          {!locationsLoading && !locationsError && buildings.length === 0 && (
            <p role="status">No campus locations are available. Contact an administrator.</p>
          )}
          <TextField name="item" value={item} onChange={setItem}>
            <Label>What do you need?</Label>
            <Input className="newrequest-input" placeholder="Large iced coffee from the Union" />
          </TextField>

          <div className="newrequest-row">
            <label className="newrequest-label">
              Pickup location
              <select
                className="newrequest-select"
                disabled={locationsLoading || buildings.length === 0}
                value={buildings.includes(pickup) ? pickup : ""}
                onChange={(e) => setPickup(e.target.value)}
              >
                <option value="">{locationsLoading ? "Loading locations..." : "Choose a building"}</option>
                {buildings.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>

            <label className="newrequest-label">
              Delivery location
              <select
                className="newrequest-select"
                disabled={locationsLoading || buildings.length === 0}
                value={buildings.includes(delivery) ? delivery : ""}
                onChange={(e) => setDelivery(e.target.value)}
              >
                <option value="">{locationsLoading ? "Loading locations..." : "Choose a building"}</option>
                {buildings.map((name) => (
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
              {/* UI follow-up: Prevent the tip input from going below zero. */}
              <Input className="newrequest-input" placeholder="3.00" min={0} />
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