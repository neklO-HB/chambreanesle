const GALLERY_KEY = 'room_galleries';

const hasWindow = () => typeof window !== 'undefined';

const parseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (err) {
    return fallback;
  }
};

const getAllGalleries = () => {
  if (!hasWindow()) return {};
  return parseJson(localStorage.getItem(GALLERY_KEY), {});
};

export function getRoomGallery(slug) {
  const galleries = getAllGalleries();
  return galleries[slug] || [];
}

export function addRoomPhoto(slug, photo) {
  if (!hasWindow()) return [];
  const galleries = getAllGalleries();
  const nextPhoto = {
    id: crypto.randomUUID(),
    addedAt: new Date().toISOString(),
    ...photo
  };
  const roomPhotos = galleries[slug] || [];
  galleries[slug] = [...roomPhotos, nextPhoto];
  localStorage.setItem(GALLERY_KEY, JSON.stringify(galleries));
  return galleries[slug];
}

export function removeRoomPhoto(slug, photoId) {
  if (!hasWindow()) return [];
  const galleries = getAllGalleries();
  const filtered = (galleries[slug] || []).filter((photo) => photo.id !== photoId);
  galleries[slug] = filtered;
  localStorage.setItem(GALLERY_KEY, JSON.stringify(galleries));
  return galleries[slug];
}

export function getAllGalleriesSnapshot() {
  return getAllGalleries();
}
