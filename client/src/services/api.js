import { findRoom, rooms } from '../data/rooms';

const BOOKING_KEY = 'chambreanesle_bookings';
const STRIPE_SETTINGS_KEY = 'stripe_settings';
const BOOKING_NOTIFICATIONS = ['chambreanesle@gmail.com', 'dylanmonard80700@gmail.com'];
const CONTACT_EMAIL = 'dupuisbrian80@outlook.fr';
const CONTACT_PHONE = '0648939733';

const defaultBookings = [
  {
    id: 'seed-1',
    roomSlug: 'eva',
    roomName: 'Eva',
    roomId: 1,
    startDate: '2024-07-15',
    endDate: '2024-07-18',
    guests: 2,
    extras: ['Petit déjeuner'],
    status: 'confirmée',
    createdAt: new Date().toISOString(),
    reservationNumber: 'AN-240715-01'
  },
  {
    id: 'seed-2',
    roomSlug: 'sohan',
    roomName: 'Sohan',
    roomId: 2,
    startDate: '2024-07-20',
    endDate: '2024-07-23',
    guests: 2,
    extras: ['Petit déjeuner', 'Accès spa'],
    status: 'confirmée',
    createdAt: new Date().toISOString(),
    reservationNumber: 'AN-240720-02'
  },
  {
    id: 'seed-3',
    roomSlug: 'eden',
    roomName: 'Eden',
    roomId: 3,
    startDate: '2024-08-05',
    endDate: '2024-08-08',
    guests: 3,
    extras: [],
    status: 'confirmée',
    createdAt: new Date().toISOString(),
    reservationNumber: 'AN-240805-03'
  }
];

const hasWindow = () => typeof window !== 'undefined';

const parseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (err) {
    return fallback;
  }
};

const getStoredBookings = () => {
  if (!hasWindow()) return [];
  const stored = localStorage.getItem(BOOKING_KEY);
  const parsed = parseJson(stored, []);
  if (parsed.length) return parsed;
  localStorage.setItem(BOOKING_KEY, JSON.stringify(defaultBookings));
  return defaultBookings;
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

const buildReservationNumber = (startDate) => {
  const [year, month, day] = startDate.split('-');
  const suffix = String(Math.floor(Math.random() * 90 + 10));
  return `AN-${year.slice(-2)}${month}${day}-${suffix}`;
};

export function getStripeSettings() {
  if (!hasWindow()) return { enableStripe: false, publishableKey: '', secretKey: '' };
  const stored = parseJson(localStorage.getItem(STRIPE_SETTINGS_KEY), null);
  if (stored) return stored;
  const defaults = {
    enableStripe: true,
    publishableKey: '',
    secretKey: '',
    webhookEmails: BOOKING_NOTIFICATIONS,
    contactEmail: CONTACT_EMAIL
  };
  localStorage.setItem(STRIPE_SETTINGS_KEY, JSON.stringify(defaults));
  return defaults;
}

export function saveStripeSettings(settings) {
  if (!hasWindow()) return settings;
  const merged = { ...getStripeSettings(), ...settings };
  localStorage.setItem(STRIPE_SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}

export async function createBooking(payload) {
  const { roomSlug, startDate, endDate, guests = 1, extras = [], contact } = payload || {};

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
    createdAt: new Date().toISOString(),
    checkInTime: '17h30',
    checkOutTime: '11h30',
    reservationNumber: buildReservationNumber(startDate),
    status: 'paiement en attente',
    contact: {
      fullName: contact?.fullName || 'Client ChambreANesle',
      email: contact?.email || CONTACT_EMAIL,
      phone: contact?.phone || CONTACT_PHONE
    },
    notifications: BOOKING_NOTIFICATIONS
  };

  const updated = [...getStoredBookings(), newBooking];
  saveBookings(updated);
  return newBooking;
}

export async function completeStripePayment(bookingId) {
  const bookings = getStoredBookings();
  const target = bookings.find((booking) => booking.id === bookingId);
  if (!target) {
    throw new Error('Réservation introuvable.');
  }

  const stripeSettings = getStripeSettings();
  const paidBooking = {
    ...target,
    status: 'payée',
    paidAt: new Date().toISOString(),
    paymentDetails: {
      processor: 'Stripe',
      publishableKey: stripeSettings.publishableKey,
      notificationEmails: stripeSettings.webhookEmails || BOOKING_NOTIFICATIONS
    }
  };

  const updated = bookings.map((booking) => (booking.id === bookingId ? paidBooking : booking));
  saveBookings(updated);
  return paidBooking;
}

export function getContactDetails() {
  return {
    phone: CONTACT_PHONE,
    email: CONTACT_EMAIL,
    notificationEmails: BOOKING_NOTIFICATIONS
  };
}

export { rooms };
