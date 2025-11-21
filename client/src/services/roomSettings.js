import { rooms as defaultRooms } from '../data/rooms';

const ROOM_KEY = 'room_settings';

const hasWindow = () => typeof window !== 'undefined';

const parseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (err) {
    return fallback;
  }
};

const getOverrides = () => {
  if (!hasWindow()) return {};
  return parseJson(localStorage.getItem(ROOM_KEY), {});
};

const persistOverrides = (overrides) => {
  if (!hasWindow()) return overrides;
  localStorage.setItem(ROOM_KEY, JSON.stringify(overrides));
  return overrides;
};

export function getRoomCatalog() {
  const overrides = getOverrides();
  return defaultRooms.map((room) => ({ ...room, ...(overrides[room.slug] || {}) }));
}

export function getRoomBySlug(slug) {
  return getRoomCatalog().find((room) => room.slug === slug) || null;
}

export function updateRoomSettings(slug, payload) {
  if (!hasWindow()) return getRoomCatalog();
  const current = getOverrides();
  current[slug] = { ...(current[slug] || {}), ...payload, updatedAt: new Date().toISOString() };
  persistOverrides(current);
  return getRoomCatalog();
}

export function resetRoom(slug) {
  if (!hasWindow()) return getRoomCatalog();
  const current = getOverrides();
  delete current[slug];
  persistOverrides(current);
  return getRoomCatalog();
}

export function getRoomOptionsSnapshot() {
  return getRoomCatalog();
}
