import { useEffect, useState } from "react";

import {
  getUsers,
  verifyUser,
} from "../../api/API.js";


function UserManagement() {
  const [users, setUsers] = useState([]);
  const [activeView, setActiveView] = useState("pending");

  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  useEffect(() => {
    async function loadUsers() {
      try {
        const userList = await getUsers();

        setUsers(userList);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);


  async function handleApprove(user) {
    try {
      setError("");
      setSuccess("");
      setApprovingId(user._id);

      await verifyUser(user._id);

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser._id === user._id
            ? { ...currentUser, verified: true }
            : currentUser
        )
      );

      setSuccess(
        `${user.firstName} ${user.lastName} has been approved.`
      );

    } catch (error) {
      setError(error.message);
    } finally {
      setApprovingId(null);
    }
  }


  function getAccountAge(createdAt) {
    if (!createdAt) {
      return "Unknown";
    }

    const createdDate = new Date(createdAt);
    const today = new Date();

    const difference =
      today.getTime() - createdDate.getTime();

    const days = Math.floor(
      difference / (1000 * 60 * 60 * 24)
    );

    if (days <= 0) {
      return "Created today";
    }

    if (days === 1) {
      return "1 day old";
    }

    if (days < 30) {
      return `${days} days old`;
    }

    const months = Math.floor(days / 30);

    if (months === 1) {
      return "1 month old";
    }

    if (months < 12) {
      return `${months} months old`;
    }

    const years = Math.floor(months / 12);

    if (years === 1) {
      return "1 year old";
    }

    return `${years} years old`;
  }


  const pendingUsers = users.filter(
    (user) => !user.verified
  );

  const verifiedUsers = users.filter(
    (user) => user.verified
  );


  if (loading) {
    return (
      <div className="py-12 text-center text-muted">
        Loading users...
      </div>
    );
  }


  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-2xl font-bold text-ink">
          User Management
        </h2>

        <p className="mt-2 text-muted">
          Review pending accounts and view current users.
        </p>
      </div>


      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted">
            Pending Accounts
          </p>

          <p className="mt-2 text-3xl font-bold text-ink">
            {pendingUsers.length}
          </p>
        </div>


        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted">
            Verified Users
          </p>

          <p className="mt-2 text-3xl font-bold text-ink">
            {verifiedUsers.length}
          </p>
        </div>


        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted">
            Total Users
          </p>

          <p className="mt-2 text-3xl font-bold text-ink">
            {users.length}
          </p>
        </div>

      </div>


      <div className="flex gap-3">

        <button
          type="button"
          onClick={() => setActiveView("pending")}
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold ${
            activeView === "pending"
              ? "bg-primary text-white"
              : "border border-border bg-surface text-ink hover:bg-gray-50"
          }`}
        >
          Pending Accounts
        </button>


        <button
          type="button"
          onClick={() => setActiveView("current")}
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold ${
            activeView === "current"
              ? "bg-primary text-white"
              : "border border-border bg-surface text-ink hover:bg-gray-50"
          }`}
        >
          Current Users
        </button>

      </div>


      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}


      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}


      {activeView === "pending" && (
        <div className="rounded-2xl border border-border bg-surface shadow-sm">

          <div className="border-b border-border px-6 py-4">
            <h3 className="text-lg font-semibold text-ink">
              Pending Accounts
            </h3>

            <p className="text-sm text-muted">
              {pendingUsers.length} account
              {pendingUsers.length === 1 ? "" : "s"} awaiting verification
            </p>
          </div>


          {pendingUsers.length === 0 ? (
            <div className="px-6 py-12 text-center">

              <p className="text-lg font-semibold text-ink">
                No accounts awaiting verification
              </p>

              <p className="mt-2 text-sm text-muted">
                All current accounts have been reviewed.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-border">

              {pendingUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>
                    <p className="font-semibold text-ink">
                      {user.firstName} {user.lastName}
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      {user.email}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      Account age: {getAccountAge(user.createdAt)}
                    </p>

                    <span className="mt-2 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                      Pending
                    </span>
                  </div>


                  <button
                    type="button"
                    onClick={() => handleApprove(user)}
                    disabled={approvingId === user._id}
                    className="cursor-pointer rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {approvingId === user._id
                      ? "Approving..."
                      : "Approve"}
                  </button>

                </div>
              ))}

            </div>
          )}

        </div>
      )}


      {activeView === "current" && (
        <div className="rounded-2xl border border-border bg-surface shadow-sm">

          <div className="border-b border-border px-6 py-4">
            <h3 className="text-lg font-semibold text-ink">
              Current Users
            </h3>

            <p className="text-sm text-muted">
              {verifiedUsers.length} verified user
              {verifiedUsers.length === 1 ? "" : "s"}
            </p>
          </div>


          {verifiedUsers.length === 0 ? (
            <div className="px-6 py-12 text-center">

              <p className="text-lg font-semibold text-ink">
                No verified users
              </p>

            </div>
          ) : (
            <div className="divide-y divide-border">

              {verifiedUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>
                    <p className="font-semibold text-ink">
                      {user.firstName} {user.lastName}
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      {user.email}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      Account age: {getAccountAge(user.createdAt)}
                    </p>
                  </div>


                  <div className="flex items-center gap-2">

                    {user.admin && (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        Admin
                      </span>
                    )}

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Verified
                    </span>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      )}

    </div>
  );
}


export default UserManagement;