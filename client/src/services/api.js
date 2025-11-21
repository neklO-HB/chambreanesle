const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

async function handleJson(response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Une erreur est survenue');
  }
  return response.json();
}

export async function getRooms() {
  const res = await fetch(`${API_BASE}/api/rooms`);
  return handleJson(res);
}

export async function getRoom(slug) {
  const res = await fetch(`${API_BASE}/api/rooms/${slug}`);
  return handleJson(res);
}

export async function getBookings() {
  const res = await fetch(`${API_BASE}/api/bookings`);
  return handleJson(res);
}

export async function createBooking(payload) {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(res);
}

export { API_BASE };
