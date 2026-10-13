import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCampusLocations, getRequests } from '../api/API.js'

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="size-4"
      aria-hidden="true"
    >
      <path
        d="M4 10h12M11 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RequestIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-6"
      aria-hidden="true"
    >
      <path
        d="M7 7h10M7 11h7M7 15h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function RouteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-6"
      aria-hidden="true"
    >
      <circle
        cx="6"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="18"
        cy="6"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-6"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m8 12 2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Home() {
  const [requests, setRequests] = useState([])
  const [locations, setLocations] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadRequests() {
      try {
        const data = await getRequests({
          sortBy: 'tip',
          sortOrder: 'desc',
        })

        if (!cancelled) {
          setRequests(data.slice(0, 2))
        }
      } catch (error) {
        console.error('Could not load home request preview:', error)
      } finally {
        if (!cancelled) {
          setLoadingRequests(false)
        }
      }
    }

    async function loadLocations() {
      try {
        const data = await getCampusLocations()

        if (!cancelled) {
          setLocations(data)
        }
      } catch (error) {
        console.error('Could not load campus locations:', error)

        if (!cancelled) {
          setLocations([])
        }
      } finally {
        if (!cancelled) {
          setLoadingLocations(false)
        }
      }
    }

    loadRequests()
    loadLocations()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-10">

      {/* HERO */}
      <section className="relative overflow-hidden rounded-[28px] border border-border bg-surface shadow-[0_24px_70px_-45px_rgba(30,64,175,0.55)]">
        <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-primary-light opacity-70 blur-3xl" />

        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">

          {/* Hero text */}
          <div className="relative flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Built for campus
            </div>

            <h1 className="m-0 max-w-xl text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Need something across campus?
              <span className="text-primary">
                {' '}DormDash it.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-body sm:text-lg">
              Request what you need from another building or pick up a
              delivery when you're already heading that way.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/new-request"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                Request something
                <ArrowIcon />
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:border-primary/30 hover:bg-primary-light"
              >
                Browse requests
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-success" />
                Campus pickup & drop-off
              </span>

              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-success" />
                Posted tips
              </span>

              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-success" />
                Confirmation at delivery
              </span>
            </div>
          </div>

          {/* Live request preview */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-700 to-indigo-700 p-6 sm:p-8 lg:p-9">
            <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                    Request board
                  </p>

                  <h2 className="m-0 mt-1 text-xl font-semibold text-white">
                    Open on campus
                  </h2>
                </div>

                <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                  <span className="size-2 rounded-full bg-green-400" />
                  Live
                </span>
              </div>

              <div className="space-y-3">
                {loadingRequests ? (
                  <>
                    <div className="h-32 animate-pulse rounded-2xl bg-white/15" />
                    <div className="h-32 animate-pulse rounded-2xl bg-white/15" />
                  </>
                ) : requests.length > 0 ? (
                  requests.map((request) => (
                    <div
                      key={request._id}
                      className="rounded-2xl border border-white/30 bg-white p-4 shadow-lg shadow-blue-950/10 transition hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="m-0 font-semibold text-ink">
                            {request.item}
                          </p>

                          <p className="m-0 mt-1 text-xs text-muted">
                            Available delivery
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                          ${(request.tip / 100).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-[18px_1fr] gap-x-3 gap-y-1 text-sm">
                        <div className="flex flex-col items-center">
                          <span className="mt-1 size-2 rounded-full bg-primary" />
                          <span className="my-1 h-5 w-px bg-border" />
                          <span className="size-2 rounded-full border-2 border-primary bg-white" />
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-muted">
                              Pickup
                            </p>

                            <p className="m-0 text-sm text-body">
                              {request.pickupLocation}
                            </p>
                          </div>

                          <div>
                            <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-muted">
                              Drop-off
                            </p>

                            <p className="m-0 text-sm text-body">
                              {request.deliveryLocation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
                    <p className="m-0 font-semibold text-white">
                      No open requests right now
                    </p>

                    <p className="m-0 mt-2 text-sm text-blue-100">
                      Looks like campus is caught up.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 text-white">
                  <CheckIcon />
                </div>

                <div>
                  <p className="m-0 text-sm font-semibold text-white">
                    Secure handoff
                  </p>

                  <p className="m-0 mt-0.5 text-xs text-blue-100">
                    Deliveries finish with a confirmation code.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section>
        <div className="mb-5">
          <p className="m-0 text-sm font-semibold text-primary">
            Simple from start to finish
          </p>

          <h2 className="m-0 mt-1 text-2xl font-bold text-ink">
            One request. Three steps.
          </h2>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-border bg-surface shadow-sm">
          <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">

            <div className="p-6 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="grid size-11 place-items-center rounded-xl bg-primary-light text-primary">
                  <RequestIcon />
                </div>

                <span className="text-sm font-bold text-border">
                  01
                </span>
              </div>

              <h3 className="m-0 text-lg font-semibold text-ink">
                Post a request
              </h3>

              <p className="m-0 mt-2 text-sm leading-6 text-body">
                Choose your pickup and drop-off, describe what you need,
                and add a tip.
              </p>
            </div>

            <div className="p-6 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="grid size-11 place-items-center rounded-xl bg-primary-light text-primary">
                  <RouteIcon />
                </div>

                <span className="text-sm font-bold text-border">
                  02
                </span>
              </div>

              <h3 className="m-0 text-lg font-semibold text-ink">
                A courier picks it up
              </h3>

              <p className="m-0 mt-2 text-sm leading-6 text-body">
                Students can browse open requests, accept one, and mark it
                picked up.
              </p>
            </div>

            <div className="p-6 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="grid size-11 place-items-center rounded-xl bg-primary-light text-primary">
                  <CheckIcon />
                </div>

                <span className="text-sm font-bold text-border">
                  03
                </span>
              </div>

              <h3 className="m-0 text-lg font-semibold text-ink">
                Confirm the handoff
              </h3>

              <p className="m-0 mt-2 text-sm leading-6 text-body">
                A six-digit confirmation code closes out the delivery when
                it reaches you.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CAMPUS LOCATIONS */}
      <section className="grid gap-7 rounded-[28px] border border-border bg-surface p-7 shadow-sm md:grid-cols-[0.85fr_1.15fr] md:p-9">

        <div className="flex flex-col justify-center">
          <p className="m-0 text-sm font-semibold text-primary">
            Campus focused
          </p>

          <h2 className="m-0 mt-2 text-3xl font-bold tracking-tight text-ink">
            Made for the trip you're already making.
          </h2>

          <p className="m-0 mt-4 leading-7 text-body">
            Find requests around campus and turn the walk between buildings
            into a delivery for another student.
          </p>

          <Link
            to="/dashboard"
            className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            Explore the request board
            <ArrowIcon />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 sm:p-6">
          <p className="m-0 mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
            Campus locations
          </p>

          <div className="space-y-2">
            {loadingLocations ? (
              <>
                <div className="h-14 animate-pulse rounded-xl bg-surface" />
                <div className="h-14 animate-pulse rounded-xl bg-surface" />
                <div className="h-14 animate-pulse rounded-xl bg-surface" />
              </>
            ) : locations.length > 0 ? (
              locations.map((location, index) => (
                <div
                  key={location._id ?? location.name}
                  className="flex items-center gap-4 rounded-xl border border-transparent bg-surface px-4 py-3 transition hover:border-primary/20 hover:shadow-sm"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-light text-xs font-bold text-primary">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <span className="text-sm font-medium text-ink">
                    {location.name}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-surface px-4 py-5 text-sm text-muted">
                No campus locations available.
              </div>
            )}
          </div>
        </div>

      </section>

    </div>
  )
}

export default Home