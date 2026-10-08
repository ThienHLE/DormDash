import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { getCurrentUser, getMyRequests, updateTracking } from '../api/API'

export default function AppLayout() {

  useEffect(() => {

    var watchIds = []

    async function startTracking() {

      try {
        // Get the currently logged-in user
        const user = await getCurrentUser()

        if (!user) {
          return
        }

        // Get deliveries assigned to this user
        const deliveries = await getMyRequests(user._id)

        for (const delivery of deliveries) {

          // Only track active deliveries
          if (
            delivery.status !== "accepted" &&
            delivery.status !== "picked_up"
          ) {
            continue
          }

          // Start watching the carrier's GPS
          const watchId = navigator.geolocation.watchPosition(

            async function (position) {

              const latitude = position.coords.latitude
              const longitude = position.coords.longitude
              const accuracy = position.coords.accuracy
              const capturedAt = position.timestamp

              try {
                await updateTracking(
                  delivery._id,
                  latitude,
                  longitude,
                  accuracy,
                  capturedAt
                )
                console.log("Carrier location sent")

              } catch (error) {
                console.log("Unable to send carrier location")
              }
            },

            function (error) {
              console.log("Unable to get GPS location")

            },

            {
              enableHighAccuracy: true
            }
          )
          watchIds.push(watchId)
        }

      } catch (error) {
        console.log("Unable to start carrier tracking")

      }
    }

    startTracking()

    // Stop tracking when leaving the layout
    return () => {
      for (const watchId of watchIds) {
        navigator.geolocation.clearWatch(watchId)
      }
    }

  }, [])

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 md:px-8 py-section">
        <Outlet />
      </main>
    </>
  )
}
