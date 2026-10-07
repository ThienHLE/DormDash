import { useEffect, useState } from "react";

import { getMyRequests } from "../../api/API.js";
import TipChart from "./TipChart.jsx";


function DeliveryHistory({ currentUser }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function loadDeliveries() {
      try {
        setError("");

        const data = await getMyRequests(currentUser._id);

        setDeliveries(data);

      } catch (error) {
        setError(error.message);

      } finally {
        setLoading(false);
      }
    }


    if (currentUser) {
      loadDeliveries();
    }
  }, [currentUser]);


  function formatDate(date) {
    if (!date) {
      return "Unknown date";
    }

    return new Date(date).toLocaleDateString();
  }


  const completedDeliveries = deliveries.filter(
    (delivery) => delivery.status === "delivered"
  );


  const totalTips = completedDeliveries.reduce(
    (total, delivery) => total + delivery.tip,
    0
  );


  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center shadow-sm">

        <p className="text-muted">
          Loading delivery history...
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


  return (
    <div className="space-y-6">


      {/* Delivery Summary */}
      <div className="grid gap-4 sm:grid-cols-2">

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">

          <p className="text-sm text-muted">
            Completed Deliveries
          </p>

          <p className="mt-2 text-3xl font-bold text-ink">
            {completedDeliveries.length}
          </p>

        </div>


        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">

          <p className="text-sm text-muted">
            Total Tips Earned
          </p>

          <p className="mt-2 text-3xl font-bold text-ink">
            ${(totalTips / 100).toFixed(2)}
          </p>

        </div>

      </div>



      {/* Tip Graph */}
      <TipChart deliveries={completedDeliveries} />



      {/* Delivery History */}
      <div>

        <h3 className="text-xl font-semibold text-ink">
          Delivery History
        </h3>


        {completedDeliveries.length === 0 ? (

          <div className="mt-4 rounded-2xl border border-border bg-surface px-6 py-14 text-center shadow-sm">

            <p className="text-lg font-semibold text-ink">
              No completed deliveries yet
            </p>

            <p className="mt-2 text-sm text-muted">
              Completed deliveries will appear here.
            </p>

          </div>

        ) : (

          <div className="mt-4 grid gap-4 md:grid-cols-2">

            {completedDeliveries.map((delivery) => (

              <div
                key={delivery._id}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <h4 className="text-lg font-semibold text-ink">
                      {delivery.item}
                    </h4>

                    <p className="mt-1 text-xs text-muted">
                      {formatDate(delivery.updatedAt)}
                    </p>

                  </div>


                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Delivered
                  </span>

                </div>


                <div className="mt-5 space-y-2 text-sm text-body">

                  <p>
                    <span className="font-semibold text-ink">
                      Pickup:
                    </span>{" "}
                    {delivery.pickupLocation}
                  </p>


                  <p>
                    <span className="font-semibold text-ink">
                      Drop-off:
                    </span>{" "}
                    {delivery.deliveryLocation}
                  </p>


                  <p>
                    <span className="font-semibold text-ink">
                      Tip earned:
                    </span>{" "}
                    ${(delivery.tip / 100).toFixed(2)}
                  </p>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}


export default DeliveryHistory;