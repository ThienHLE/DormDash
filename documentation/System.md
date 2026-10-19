# System Endpoints

These support routes do not belong to a specific supplied user story. Both are public and return text rather than the JSON envelopes used by feature endpoints.

### GET `/`

Source: [`index.js`](../api/index.js). **Body:** None.

**Success — 200:** `Welcome to DormDash API`.

Provides a basic indication that the HTTP application is responding.

### GET `/api/v1/ping`

Source: [`ping.js`](../api/endpoints/ping.js). **Body:** None.

**Success — 200:** `Pong!`.

Does not query MongoDB or external providers. Although normal server startup connects to MongoDB first, a successful ping does not verify continued database or routing-service health.
