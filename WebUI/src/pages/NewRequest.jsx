import { useState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react"; 
import "../css/newrequest.css";
import "../css/styling.css";

// Temp list until Nancy's /api/buildings endpoint is ready
const BUILDINGS = [
    { id: "b1", name: "Boreham Library" },
    { id: "b2", name: "Smith-Pendergraft Campus Center" },
    { id: "b3", name: "Lion's Den" },
    { id: "b4", name: "Sebastian Commons" },
    { id: "b5", name: "Baldor Building" },
]

export default function NewRequest() {
    const [item, setItem] = useState("");
    const [pickup, setPickup] = useState("");
    const [delivery, setDelivery] = useState("");
    const [tip, setTip] = useState("");

    const isValid = 
      item.trim() !== "" &&
      pickup !== "" &&
      delivery !== "" &&
      pickup !== delivery &&
      tip !== "" &&
      Number(tip) >= 0;

    function handleSubmit() {
        const request = {
            item: item.trim(),
            pickupBuildingId: pickup,
            deliveryBuildingId: delivery,
            tipAmount: Math.round(Number(tip) * 100), // Convert to cents
        };
        console.log("Submitting request:", request);
    }

     return (
    <div className="newrequest-page">
      <h1 className="newrequest-title">New Delivery Request</h1>

      <div className="newrequest-form">
        <TextField name="item" value={item} onChange={setItem}>
          <Label>What do you need?</Label>
          <Input placeholder="Large iced coffee from the Union" />
        </TextField>

        <label className="newrequest-label">
          Pickup location
          <select value={pickup} onChange={(e) => setPickup(e.target.value)}>
            <option value="">Choose a building</option>
            {BUILDINGS.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>

        <label className="newrequest-label">
          Delivery location
          <select value={delivery} onChange={(e) => setDelivery(e.target.value)}>
            <option value="">Choose a building</option>
            {BUILDINGS.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>

        {pickup !== "" && pickup === delivery && (
          <p className="newrequest-error">Pickup and delivery must be different.</p>
        )}

        <TextField name="tip" type="number" value={tip} onChange={setTip}>
          <Label>Tip ($)</Label>
          <Input placeholder="3.00" />
        </TextField>

        <Button variant="primary" isDisabled={!isValid} onPress={handleSubmit}>
          Submit Request
        </Button>
      </div>
    </div>
  );
}