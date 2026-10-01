import axios from "axios";

const BASE_URL = "/api/v1/auth";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const client = axios.create({ baseURL: BASE_URL, withCredentials: true });

async function request(path, { method = "GET", body } = {}) {
  try {
    const { data } = await client.request({ url: path, method, data: body });
    return data.content;
  } catch (error) {
    if (!error.response) throw new ApiError(0, "Could not reach the server");
    throw new ApiError(error.response.status, error.response.data?.content?.message ?? "Something went wrong");
  }
}

export async function signup({ email, password, firstName, lastName }) {
  return (await request("/signup", { method: "POST", body: { email, password, firstName, lastName } })).user;
}

export async function login(email, password) {
  return (await request("/login", { method: "POST", body: { email, password } })).user;
}

export async function logout() {
  await request("/logout", { method: "POST" });
}

export async function getCurrentUser() {
  try {
    return (await request("/me")).user;
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export async function getUser(id) {
  return (await request(`/user/${encodeURIComponent(id)}`)).user;
}

export async function getUsers() {
  return (await request("/getUsers")).users;
}

export async function updateUser(changes) {
  return (await request("/update", { method: "PATCH", body: changes })).user;
}

export async function verifyUser(id) {
  return (await request(`/verifyUser/${encodeURIComponent(id)}`, { method: "PATCH" })).user;
}

export async function getRequests() {
  const {data} = await axios.post("/api/v1/requests/list");
  return data.data; 
}

export async function getMyRequests(courierId) {
  const {data} = await axios.post("/api/v1/requests/my", { courierId: courierId });
  return data.data; 
}

export async function acceptRequest(id, courierId){
  const {data} = await axios.post(`/api/v1/requests/${id}/accept`, {courierId: courierId });
  return data.data;
}

//Create a delivery request.
export async function createDelivery({ requesterId, item, instructions, pickupLocation, deliveryLocation, tip }) {
  try {
    const { data } = await axios.post(
      "/api/v1/deliveries/createDeliveryRequest",
      { requesterId, item, instructions, pickupLocation, deliveryLocation, tip },
      { withCredentials: true }
    );
    return data.content;
  } catch (error) {
    if (!error.response) throw new ApiError(0, "Could not reach the server");
    const body = error.response.data;
    throw new ApiError(error.response.status, body?.statusMessage ?? body?.message ?? "Something went wrong");
  }
}
