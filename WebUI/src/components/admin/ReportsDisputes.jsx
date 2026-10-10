import { useEffect, useState } from "react";
import {
  getAllDisputes,
  deleteDisputePost,
  getUsers,
  unverifyUser,
  updateDisputeStatus,
} from "../../api/API.js";

const statuses = ["In Review", "No Action", "Resolved"];
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "statusAsc", label: "Status A-Z" },
  { value: "statusDesc", label: "Status Z-A" },
];

function ReportsDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const users = await getUsers();
        if (active) {
          setUsersById(Object.fromEntries(
            users.map((user) => [
              String(user._id),
              {
                name: `${user.firstName} ${user.lastName}`.trim(),
                verified: user.verified,
              },
            ])
          ));
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      }
    }

    loadUsers();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDisputes() {
      setLoading(true);
      setError("");
      try {
        const result = await getAllDisputes({
          status: statusFilter || undefined,
          sortBy,
        });
        if (active) setDisputes(result);
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
  }, [statusFilter, sortBy]);

  async function handleStatusChange(dispute, status) {
    setError("");
    setSuccess("");
    setUpdatingId(dispute._id);
    try {
      const updated = await updateDisputeStatus(dispute._id, status);
      if (statusFilter && statusFilter !== status) {
        setDisputes((current) => current.filter((item) => item._id !== dispute._id));
      } else {
        setDisputes((current) => current.map((item) =>
          item._id === updated._id ? { ...item, ...updated } : item
        ));
      }
      setSuccess("Dispute status updated.");
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(value) {
    if (!value) return "Unknown date";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
  }

  function getPersonName(id) {
    return usersById[String(id)]?.name || "Unknown user";
  }

  async function handleUnverify(dispute) {
    const userId = String(dispute.disputedUserId);
    if (!window.confirm(`Unverify ${getPersonName(userId)}? They will lose verified status.`)) return;

    setError("");
    setSuccess("");
    setUpdatingId(dispute._id);
    try {
      await unverifyUser(userId);
      setUsersById((current) => ({
        ...current,
        [userId]: { ...current[userId], verified: false },
      }));
      setSuccess(`${getPersonName(userId)} is now unverified.`);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeletePost(dispute) {
    if (!window.confirm("Permanently delete the delivery post linked to this dispute?")) return;

    setError("");
    setSuccess("");
    setUpdatingId(dispute._id);
    try {
      await deleteDisputePost(dispute._id);
      setDisputes((current) => current.map((item) =>
        item._id === dispute._id ? { ...item, postExists: false } : item
      ));
      setSuccess("Delivery post deleted.");
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ink">Reports &amp; Disputes</h2>
        <p className="mt-2 text-muted">
          Review disputes and update their status.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="dispute-status-filter">Filter by status</label>
        <select
          id="dispute-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-ink"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>

        <label className="sr-only" htmlFor="dispute-sort">Sort disputes</label>
        <select
          id="dispute-sort"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-ink"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-ink">Disputes</h3>
          <p className="text-sm text-muted">Review the message and involved users for each dispute.</p>
        </div>

        {loading ? (
          <p className="px-6 py-16 text-center text-muted">Loading disputes...</p>
        ) : disputes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-semibold text-ink">No disputes found</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              There are no disputes matching the selected status.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {disputes.map((dispute) => (
              <li key={dispute._id} className="space-y-4 px-6 py-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-sm text-muted">
                      Created {formatDate(dispute.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Delivery post: {dispute.postExists ? dispute.postId : "Deleted"}
                    </p>
                    <p className="mt-2 text-sm text-ink">
                      <span className="font-semibold">Reported by:</span>{" "}
                      {getPersonName(dispute.createdBy)} ({dispute.createdByRole})
                    </p>
                    <p className="mt-1 text-sm text-ink">
                      <span className="font-semibold">Against:</span>{" "}
                      {getPersonName(dispute.disputedUserId)} ({dispute.disputedUserRole})
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                    Status
                    <select
                      value={dispute.status}
                      disabled={updatingId === dispute._id}
                      onChange={(event) => handleStatusChange(dispute, event.target.value)}
                      className="rounded-lg border border-border bg-surface px-3 py-2 font-normal disabled:opacity-60"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <p className="whitespace-pre-wrap rounded-lg bg-background p-4 text-sm text-body">
                  {dispute.message}
                </p>
                {dispute.status === "In Review" && (
                  <div className="flex flex-wrap gap-2">
                    {usersById[String(dispute.disputedUserId)]?.verified && (
                      <button
                        type="button"
                        disabled={updatingId === dispute._id}
                        onClick={() => handleUnverify(dispute)}
                        className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60"
                      >
                        Unverify {getPersonName(dispute.disputedUserId)}
                      </button>
                    )}
                    {dispute.postExists && (
                      <button
                        type="button"
                        disabled={updatingId === dispute._id}
                        onClick={() => handleDeletePost(dispute)}
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        Delete delivery post
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default ReportsDisputes;
