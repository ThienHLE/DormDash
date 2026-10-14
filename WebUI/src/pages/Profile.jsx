import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal, Tabs } from "@heroui/react";

import { fundUser, getCurrentUser } from "../api/API.js";
import OrderHistory from "../components/profile/OrderHistory.jsx";
import DeliveryHistory from "../components/profile/DeliveryHistory.jsx";
import DisputesHistory from "../components/profile/DisputesHistory.jsx";


function Profile() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFundingOpen, setIsFundingOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundError, setFundError] = useState("");
  const [funding, setFunding] = useState(false);

  async function addFunds(event) {
    event.preventDefault();
    setFundError("");
    const amount = Number(fundAmount);
    const fund = Math.round(amount * 100);
    if (!Number.isFinite(amount) || fund <= 0 || Math.abs(amount * 100 - fund) > 1e-7) {
      setFundError("Enter a valid amount with up to two decimal places.");
      return;
    }

    setFunding(true);
    try {
      setCurrentUser(await fundUser(fund));
      setFundAmount("");
      setIsFundingOpen(false);
    } catch (error) {
      setFundError(error.message);
    } finally {
      setFunding(false);
    }
  }


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

              <div className="mt-4 flex items-center gap-3">
                <p className="text-lg font-semibold text-ink">
                  Balance: ${((currentUser.balance ?? 0) / 100).toFixed(2)}
                </p>
                <Button
                  variant="primary"
                  onPress={() => {
                    setFundError("");
                    setIsFundingOpen(true);
                  }}
                  className="bg-primary text-white"
                >
                  Add Funds
                </Button>
              </div>

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

      <Modal>
        <Modal.Backdrop
          isOpen={isFundingOpen}
          onOpenChange={(open) => {
            if (!open && !funding) setIsFundingOpen(false);
          }}
        >
          <Modal.Container>
            <Modal.Dialog>
              <form onSubmit={addFunds}>
                <Modal.Header>
                  <Modal.Heading>Add Funds</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <label htmlFor="fund-amount" className="mb-1 block text-sm font-semibold text-ink">
                    Amount ($)
                  </label>
                  <input
                    id="fund-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={fundAmount}
                    onChange={(event) => setFundAmount(event.target.value)}
                    className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-ink"
                    placeholder="0.00"
                  />
                  {fundError && <p role="alert" className="mt-2 text-sm text-red-700">{fundError}</p>}
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    type="submit"
                    variant="primary"
                    isDisabled={funding || !fundAmount}
                    className="bg-primary text-white"
                  >
                    {funding ? "Adding..." : "Add Funds"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    isDisabled={funding}
                    onPress={() => setIsFundingOpen(false)}
                  >
                    Cancel
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>



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

            <Tabs.Tab id="disputes">
              Disputes
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


            <OrderHistory currentUser={currentUser} />

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

        <Tabs.Panel id="disputes">
          <div className="mt-6 space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-ink">Disputes You Created</h2>
              <p className="mt-1 text-muted">
                View the reports you submitted and their current status.
              </p>
            </div>
            <DisputesHistory currentUser={currentUser} />
          </div>
        </Tabs.Panel>

      </Tabs>

    </div>
  );
}


export default Profile;