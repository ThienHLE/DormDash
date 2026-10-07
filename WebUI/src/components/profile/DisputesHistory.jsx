import { useEffect, useState } from "react";
import { getMyDisputes } from "../../api/API.js";

function DisputesHistory({ currentUser }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDisputes() {
      try {
        const allDisputes = await getMyDisputes();
        if (active) {
          setDisputes(allDisputes.filter(
            (dispute) => String(dispute.createdBy) === String(currentUser._id)
          ));
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDisputes();
    return () => {
      active = false;
    };
  }, [currentUser._id]);

  if (loading) {
    return <p className="py-12 text-center text-muted">Loading your disputes...</p>;
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center shadow-sm">
        <p className="text-lg font-semibold text-ink">No disputes created</p>
        <p className="mt-2 text-sm text-muted">Disputes you report will appear here.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {disputes.map((dispute) => (
        <li key={dispute._id} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-ink">Dispute</h3>
              <p className="mt-1 text-xs text-muted">
                Created {dispute.createdAt ? new Date(dispute.createdAt).toLocaleString() : "Unknown date"}
              </p>
              <p className="mt-1 text-xs text-muted">Delivery post: {String(dispute.postId)}</p>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              {dispute.status}
            </span>
          </div>
          <p className="mt-4 whitespace-pre-wrap rounded-lg bg-background p-4 text-sm text-body">
            {dispute.message}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default DisputesHistory;
