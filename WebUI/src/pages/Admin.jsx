import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCurrentUser } from "../api/API.js";

import UserManagement from "../components/admin/UserManagement.jsx";
import ReportsDisputes from "../components/admin/ReportsDisputes.jsx";


function Admin() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("users");


  useEffect(() => {
    async function checkAdmin() {
      try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
          navigate("/login");
          return;
        }

        if (!currentUser.admin) {
          navigate("/");
          return;
        }

      } catch (error) {
        navigate("/");
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [navigate]);


  if (loading) {
    return (
      <div className="py-12 text-center text-muted">
        Loading admin dashboard...
      </div>
    );
  }


  return (
    <div className="space-y-8">

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          DormDash Admin
        </p>

        <h1 className="mt-2 text-3xl font-bold text-ink">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-muted">
          Manage DormDash users and administrative tools.
        </p>
      </div>


      <div className="border-b border-border">
        <div className="flex gap-8">

          <button
            type="button"
            onClick={() => setActiveSection("users")}
            className={`cursor-pointer border-b-2 px-1 pb-3 text-base font-semibold transition ${
              activeSection === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            User Management
          </button>


          <button
            type="button"
            onClick={() => setActiveSection("reports")}
            className={`cursor-pointer border-b-2 px-1 pb-3 text-base font-semibold transition ${
              activeSection === "reports"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            Reports & Disputes
          </button>

        </div>
      </div>


      {activeSection === "users" && (
        <UserManagement />
      )}


      {activeSection === "reports" && (
        <ReportsDisputes />
      )}

    </div>
  );
}


export default Admin;