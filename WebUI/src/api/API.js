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

export async function unverifyUser(id) {
  return (await request(`/unverifyUser/${encodeURIComponent(id)}`, { method: "PATCH" })).user;
}

// US-08: Retrieve available requests with optional filters and sorting.
export async function getRequests(filters = {}) {
  const { data } = await axios.post(
    "/api/v1/requests/list",
    filters
  );

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

//get code for confirmation
export async function generateCode(deliveryId){

  try{
    const {data} = await axios.post(

      "/api/v1/deliveryConfirmation/generateCode",
      {deliveryId},
      { withCredentials: true }

    );
    return data.content.code; 

  } catch(error){
    if (!error.response) throw new ApiError(0, "Could not reach the server");
    const body = error.response.data;
    throw new ApiError(error.response.status, body?.statusMessage ?? body?.message ?? "Something went wrong");
  }
}

//confirm code entered 
export async function confirmCode(deliveryId, code) {

  try{

    const {data} = await axios.post(
      "/api/v1/deliveryConfirmation/confirmCode",
      {deliveryId, code},
      { withCredentials: true }
    );
    return data.content; 

  } catch(error){
    if (!error.response) throw new ApiError(0, "Could not reach the server");
    const body = error.response.data;
    throw new ApiError(error.response.status, body?.content?.message ?? body?.statusMessage ?? "Something went wrong");
  }
}

// Get all deliveries requested by the currently logged-in user.
export async function getMyDeliveries() {
  try {
    const { data } = await axios.get(
      "/api/v1/deliveries/myDeliveries",
      { withCredentials: true }
    );

    return data.content;

  } catch (error) {
    if (!error.response) {
      throw new ApiError(0, "Could not reach the server");
    }

    const body = error.response.data;

    throw new ApiError(
      error.response.status,
      body?.statusMessage ?? body?.message ?? "Something went wrong"
    );
  }
}

// Mark an accepted delivery as picked up.
export async function pickUpDelivery(deliveryId) {
  try {
    const { data } = await axios.post(
      "/api/v1/deliveries/pickUpDelivery",
      { deliveryId },
      { withCredentials: true }
    );

    return data.content;

  } catch (error) {
    if (!error.response) {
      throw new ApiError(0, "Could not reach the server");
    }

    const body = error.response.data;

    throw new ApiError(
      error.response.status,
      body?.statusMessage ?? body?.message ?? "Something went wrong"
    );
  }
}

async function requestDisputes(path, { method = "GET", body } = {}) {
  try {
    const { data } = await axios.request({
      url: `/api/v1/disputes${path}`,
      method,
      data: body,
      withCredentials: true,
    });
    return data.content;
  } catch (error) {
    if (!error.response) throw new ApiError(0, "Could not reach the server");
    const response = error.response.data;
    throw new ApiError(
      error.response.status,
      response?.statusMessage ?? response?.content?.message ?? response?.message ?? "Something went wrong"
    );
  }
}

// Get disputes involving the currently logged-in user.
export async function getMyDisputes() {
  return (await requestDisputes("")).disputes;
}

// Get all disputes with optional status filtering and sorting; requires an administrator session.
export async function getAllDisputes({ status, sortBy = "newest" } = {}) {
  const params = new URLSearchParams({ sortBy });
  if (status) params.set("status", status);
  const query = `?${params.toString()}`;
  return (await requestDisputes(`/listAll${query}`)).disputes;
}

// Create a dispute about a delivery post; the API determines the other participant.
export async function createDispute({ postId, message }) {
  return (await requestDisputes("/create", {
    method: "POST",
    body: { postId, message },
  })).dispute;
}

// Set a dispute to In Review, No Action, or Resolved; the API requires admin access.
export async function updateDisputeStatus(disputeId, status) {
  return (await requestDisputes(`/updateStatus/${encodeURIComponent(disputeId)}`, {
    method: "PUT",
    body: { status },
  })).dispute;
}

export async function deleteDisputePost(disputeId) {
  return requestDisputes(`/${encodeURIComponent(disputeId)}/post`, {
    method: "DELETE",
  });
}