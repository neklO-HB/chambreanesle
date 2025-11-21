import { findRoom, rooms } from '../data/rooms';

const BOOKING_KEY = 'chambreanesle_bookings';

const hasWindow = () => typeof window !== 'undefined';

const parseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

const getStoredBookings = () => {
  if (!hasWindow()) return [];
  const stored = localStorage.getItem(BOOKING_KEY);
  return parseJson(stored, []);
};

const saveBookings = (bookings) => {
  if (!hasWindow()) return [];
  localStorage.setItem(BOOKING_KEY, JSON.stringify(bookings));
  return bookings;
};

export async function getRooms() {
  return rooms;
}

export async function getRoom(slug) {
  const room = findRoom(slug);
  if (!room) {
    throw new Error('Chambre introuvable.');
  }
  return room;
}

export async function getBookings() {
  return getStoredBookings();
}

export async function createBooking(payload) {
  const { roomSlug, startDate, endDate, guests = 1, extras = [] } = payload || {};

  if (!roomSlug || !startDate || !endDate) {
    throw new Error('Les champs roomSlug, startDate et endDate sont obligatoires.');
  }

  const room = findRoom(roomSlug);
  if (!room) {
    throw new Error('Chambre introuvable.');
  }

  const newBooking = {
    id: crypto.randomUUID(),
    roomId: room.id,
    roomSlug,
    roomName: room.name,
    startDate,
    endDate,
    guests,
    extras,
    createdAt: new Date().toISOString()
  };

  const updated = [...getStoredBookings(), newBooking];
  saveBookings(updated);
  return newBooking;
}

export { rooms };
