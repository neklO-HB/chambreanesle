const EXTRA_KEY = 'reservation_extras';

const hasWindow = () => typeof window !== 'undefined';

const parseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (err) {
    return fallback;
  }
};

const getStoredExtras = () => {
  if (!hasWindow()) return [];
  const stored = parseJson(localStorage.getItem(EXTRA_KEY), []);
  if (stored.length) return stored;
  const defaults = [
    { id: 'breakfast', label: 'Petit déjeuner (20€/personne)', price: 20 },
    { id: 'spa', label: 'Accès spa (35€/personne)', price: 35 }
  ];
  localStorage.setItem(EXTRA_KEY, JSON.stringify(defaults));
  return defaults;
};

const saveExtras = (extras) => {
  if (!hasWindow()) return extras;
  localStorage.setItem(EXTRA_KEY, JSON.stringify(extras));
  return extras;
};

export function getExtras() {
  return getStoredExtras();
}

export function addExtra(extra) {
  const current = getStoredExtras();
  const newExtra = {
    id: crypto.randomUUID(),
    label: extra.label,
    price: Number(extra.price) || 0
  };
  return saveExtras([...current, newExtra]);
}

export function updateExtra(id, payload) {
  const current = getStoredExtras();
  return saveExtras(current.map((extra) => (extra.id === id ? { ...extra, ...payload } : extra)));
}

export function deleteExtra(id) {
  const current = getStoredExtras();
  return saveExtras(current.filter((extra) => extra.id !== id));
}

export function getExtrasSnapshot() {
  return getStoredExtras();
}
