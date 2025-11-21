const SECTION_KEY = 'cms_sections';
const MEMBER_KEY = 'cms_members';

const hasWindow = () => typeof window !== 'undefined';

const parseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (err) {
    return fallback;
  }
};

export function getSections(page) {
  if (!hasWindow()) return [];
  const stored = localStorage.getItem(SECTION_KEY);
  const parsed = parseJson(stored, []);
  const sections = Array.isArray(parsed) ? parsed : [];
  if (!page) return sections;
  return sections.filter((section) => section.page === page);
}

export function upsertSection(section) {
  if (!hasWindow()) return [];
  const stored = parseJson(localStorage.getItem(SECTION_KEY), []);
  const existingIndex = stored.findIndex(
    (item) => item.page === section.page && item.key === section.key
  );

  if (existingIndex >= 0) {
    stored[existingIndex] = { ...stored[existingIndex], ...section, updatedAt: new Date().toISOString() };
  } else {
    stored.push({ ...section, createdAt: new Date().toISOString() });
  }

  localStorage.setItem(SECTION_KEY, JSON.stringify(stored));
  return stored;
}

export function getMembers() {
  if (!hasWindow()) return [];
  const stored = localStorage.getItem(MEMBER_KEY);
  const members = parseJson(stored, []);
  if (members.length) return members;
  const defaults = [
    {
      id: crypto.randomUUID(),
      name: 'Hôte premium',
      email: 'client@chambreanesle.fr',
      phone: '+33 6 12 34 56 78',
      role: 'Voyageur',
      createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem(MEMBER_KEY, JSON.stringify(defaults));
  return defaults;
}

export function addMember(member) {
  if (!hasWindow()) return [];
  const existing = getMembers();
  const newMember = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...member };
  const updated = [...existing, newMember];
  localStorage.setItem(MEMBER_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteMember(id) {
  if (!hasWindow()) return [];
  const filtered = getMembers().filter((member) => member.id !== id);
  localStorage.setItem(MEMBER_KEY, JSON.stringify(filtered));
  return filtered;
}
