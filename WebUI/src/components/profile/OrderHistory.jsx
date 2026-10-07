import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";

import { getMyDeliveries } from "../../api/API.js";


function OrderHistory() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function loadOrders() {
      try {
        setError("");

        const deliveries = await getMyDeliveries();

        setOrders(deliveries);

      } catch (error) {
        setError(error.message);

      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);


  function getStatusLabel(status) {
    switch (status) {
      case "open":
        return "Waiting for Courier";

      case "accepted":
        return "Courier Assigned";

      case "picked_up":
        return "Picked Up";

      case "delivered":
        return "Delivered";

      default:
        return status;
    }
  }


  function getStatusStyle(status) {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-700";

      case "accepted":
        return "bg-blue-100 text-blue-700";

      case "picked_up":
        return "bg-purple-100 text-purple-700";

      case "delivered":
        return "bg-green-100 text-green-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }


  function formatDate(date) {
    if (!date) {
      return "Unknown date";
    }

    return new Date(date).toLocaleDateString();
  }


  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center shadow-sm">
        <p className="text-muted">
          Loading your orders...
        </p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }


  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center shadow-sm">

        <p className="text-lg font-semibold text-ink">
          No orders yet
        </p>

        <p className="mt-2 text-sm text-muted">
          Orders you request will appear here.
        </p>

      </div>
    );
  }


  return (
    <div className="grid gap-4 md:grid-cols-2">

      {orders.map((order) => (

        <div
          key={order._id}
          className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
        >

          <div className="flex items-start justify-between gap-4">

            <div>

              <h3 className="text-lg font-semibold text-ink">
                {order.item}
              </h3>

              <p className="mt-1 text-xs text-muted">
                {formatDate(order.createdAt)}
              </p>

            </div>


            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(order.status)}`}
            >
              {getStatusLabel(order.status)}
            </span>

          </div>


          <div className="mt-5 space-y-2 text-sm text-body">

            <p>
              <span className="font-semibold text-ink">
                Pickup:
              </span>{" "}
              {order.pickupLocation}
            </p>


            <p>
              <span className="font-semibold text-ink">
                Drop-off:
              </span>{" "}
              {order.deliveryLocation}
            </p>


            <p>
              <span className="font-semibold text-ink">
                Tip:
              </span>{" "}
              ${(order.tip / 100).toFixed(2)}
            </p>


            {order.instructions && (

              <p>
                <span className="font-semibold text-ink">
                  Instructions:
                </span>{" "}
                {order.instructions}
              </p>

            )}

          </div>


          {["accepted", "picked_up"].includes(order.status) && (

            <div className="mt-5">

              <Button
                variant="primary"
                onPress={() =>
                  navigate(`/deliveries/${order._id}/code`)
                }
                className="bg-primary text-white"
              >
                Show confirmation code
              </Button>

            </div>

          )}

        </div>

      ))}

    </div>
  );
}


export default OrderHistory;