const API_BASE = import.meta.env.VITE_API_BASE || "https://localhost:7153";
const RECEPTION_API_BASE = `${API_BASE}/api/Reception`;

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readResponse(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || "Request failed" };
  }
}

async function request(method, path, body) {
  const res = await fetch(`${RECEPTION_API_BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401 || res.status === 403) {
    const err = new Error("Unauthorized. Please login again.");
    err.unauthorized = true;
    throw err;
  }

  const data = await readResponse(res);
  if (!res.ok) throw data;
  return data;
}

export const receptionApi = {
  getDashboard: () => request("GET", "/dashboard"),
  getPatients: () => request("GET", "/patients"),
  getPatient: (id) => request("GET", `/patients/${id}`),
  addPatient: (body) => request("POST", "/patients", body),
  getPatients: () => request("GET", "/patients"),
  getAvailableDoctors: () => request("GET", "/doctors/available"),
  getAppointments: (params) => request("GET", `/appointments?${params}`),
  bookAppointment: (body) => request("POST", "/appointments", body),
  checkInAppointment: (id) => request("PUT", `/appointments/${id}/checkin`),
  getPayments: (params) => request("GET", `/payments?${params}`),
  createPaymentInvoice: (body) => request("POST", "/payments", body),
  initiatePayment: (invoiceId, body) => request("POST", `/payments/${invoiceId}/pay`, body),
  markCashPayment: (invoiceId, body) => request("POST", `/payments/${invoiceId}/cash`, body),
};