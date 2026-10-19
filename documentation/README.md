# Endpoint Documentation

These documents describe the current API implementation, grouped using the user-story table supplied for this task. They document behavior, not a claim that every acceptance criterion is complete. Related stories share files; support routes have their own page.

| Story | Documentation |
| --- | --- |
| US-01: Account access; US-07: Student verification | [Accounts and verification](US-01,US-07.md) |
| US-02: Create delivery requests | [Delivery creation](US-02.md) |
| US-03: Browse; US-04: Accept; US-08: Filter | [Courier requests](US-03,US-04,US-08.md) |
| US-05: Delivery progress; US-06: Confirmation codes | [Progress and handoff](US-05,US-06.md) |
| US-09: Estimated delivery time | [Walking-duration support and limitations](US-09.md) |
| US-12: Reports and disputes | [Disputes](US-12.md) |
| US-13: Live location; US-14: Campus maps | [Tracking, locations, and routing](US-13,US-14.md) |
| Supporting routes | [System endpoints](System.md) |

The supplied table does not include US-10 or US-11, so no mapping was invented for them. User/profile lookup routes are grouped with accounts. Admin location management supports the map story.

## Complete Route Inventory

Routes are mounted by filename under `/api/v1` in `api/index.js`, except the root welcome route.

| Method | Path | Story / document |
| --- | --- | --- |
| GET | `/` | System |
| GET | `/api/v1/ping` | System |
| POST | `/api/v1/auth/signup` | US-01 |
| POST | `/api/v1/auth/login` | US-01 |
| POST | `/api/v1/auth/logout` | US-01 |
| GET | `/api/v1/auth/me` | US-01 |
| GET | `/api/v1/auth/user/:id` | US-01 supporting profile lookup |
| PATCH | `/api/v1/auth/update` | US-01 supporting profile update |
| GET | `/api/v1/auth/getUsers` | US-07 |
| PATCH | `/api/v1/auth/verifyUser/:id` | US-07 |
| PATCH | `/api/v1/auth/unverifyUser/:id` | US-07 |
| POST | `/api/v1/deliveries/createDeliveryRequest` | US-02 |
| POST | `/api/v1/requests/list` | US-03, US-08 |
| POST | `/api/v1/requests/:id/accept` | US-04 |
| POST | `/api/v1/requests/my` | US-04, US-05 |
| POST | `/api/v1/requests/:id/detail` | US-03, US-04, US-05 |
| POST | `/api/v1/deliveries/pickUpDelivery` | US-05 |
| GET | `/api/v1/deliveries/myDeliveries` | US-05 |
| POST | `/api/v1/deliveryConfirmation/generateCode` | US-06 |
| POST | `/api/v1/deliveryConfirmation/confirmCode` | US-05, US-06 |
| GET | `/api/v1/disputes` | US-12 |
| GET | `/api/v1/disputes/listAll` | US-12 |
| POST | `/api/v1/disputes/create` | US-12 |
| PUT | `/api/v1/disputes/updateStatus/:id` | US-12 |
| DELETE | `/api/v1/disputes/:id/post` | US-12 |
| POST | `/api/v1/tracking/update` | US-13 |
| POST | `/api/v1/tracking/location` | US-13 |
| POST | `/api/v1/locations/list` | US-14 (also supports request forms and filters) |
| POST | `/api/v1/locations/create` | US-14 |
| POST | `/api/v1/locations/:id/deactivate` | US-14 |
| POST | `/api/v1/maps/delivery` | US-14, US-09 |

## Shared Conventions and Implementation Differences

- JSON bodies use `Content-Type: application/json`. Authentication uses session cookies, not a bearer token. See each endpoint for its actual access checks.
- Most feature routes use `{ statusCode, statusMessage, content }`. Requests routes use `{ statusCode, message, data }`; system routes return text.
- ObjectIds serialize as strings, dates as ISO strings, and delivery tips are integer cents.
- Unknown paths/methods and some errors handled before router middleware use Express's default responses; not every failure has a JSON envelope.
- US-13 uses the team's revised HTTP-polling design, although the supplied story still mentions Socket.IO. Backend code alone does not guarantee the five-second frontend update target or immediate detection of a closed page.
- US-09 currently exposes route duration, not a live courier-based ETA. US-12 does not store resolution notes. Verification flags in US-07 are not a universal access gate.

The inventory includes all 31 explicit routes currently declared in `api/index.js` and `api/endpoints/*.js`. Documentation does not change application behavior.
