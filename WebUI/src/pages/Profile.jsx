import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs } from "@heroui/react";

import { getCurrentUser } from "../api/API.js";
import OrderHistory from "../components/profile/OrderHistory.jsx";
import DeliveryHistory from "../components/profile/DeliveryHistory.jsx";


function Profile() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await getCurrentUser();

        if (!user) {
          navigate("/login");
          return;
        }

        setCurrentUser(user);

      } catch (error) {
        console.error(error);
        navigate("/login");

      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);


  if (loading) {
    return (
      <div className="py-12 text-center text-muted">
        Loading profile...
      </div>
    );
  }


  if (!currentUser) {
    return null;
  }


  return (
    <div className="space-y-8">

      {/* Profile Header */}
      <div>

        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          DormDash
        </p>

        <h1 className="mt-2 text-3xl font-bold text-ink">
          Profile
        </h1>


        <div className="mt-5 rounded-2xl border border-border bg-surface p-6 shadow-sm">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-semibold text-ink">
                {currentUser.firstName} {currentUser.lastName}
              </h2>

              <p className="mt-1 text-sm text-muted">
                {currentUser.email}
              </p>

            </div>


            <div className="flex gap-2">

              {currentUser.verified && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Verified
                </span>
              )}


              {currentUser.admin && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Admin
                </span>
              )}

            </div>

          </div>

        </div>

      </div>



      {/* Profile Tabs */}
      <Tabs
        defaultSelectedKey="orders"
        variant="secondary"
        align="start"
      >

        <Tabs.ListContainer>

          <Tabs.List aria-label="Profile history">

            <Tabs.Tab id="orders">
              Your Orders
              <Tabs.Indicator />
            </Tabs.Tab>


            <Tabs.Tab id="deliveries">
              Deliveries
              <Tabs.Indicator />
            </Tabs.Tab>

          </Tabs.List>

        </Tabs.ListContainer>



        {/* YOUR ORDERS */}
        <Tabs.Panel id="orders">

          <div className="mt-6 space-y-5">

            <div>

              <h2 className="text-2xl font-bold text-ink">
                Your Orders
              </h2>

              <p className="mt-1 text-muted">
                View orders you have requested and their current status.
              </p>

            </div>


            <OrderHistory />

          </div>

        </Tabs.Panel>



        {/* DELIVERIES */}
        <Tabs.Panel id="deliveries">

          <div className="mt-6 space-y-5">

            <div>

              <h2 className="text-2xl font-bold text-ink">
                Deliveries
              </h2>

              <p className="mt-1 text-muted">
                View deliveries you have completed and track your tips.
              </p>

            </div>


            <DeliveryHistory currentUser={currentUser} />

          </div>

        </Tabs.Panel>

      </Tabs>

    </div>
  );
}


export default Profile;