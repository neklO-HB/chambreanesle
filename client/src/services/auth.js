const USER_KEY = 'member_users';
const SESSION_KEY = 'member_session';
const RESET_KEY = 'member_password_resets';

const hasWindow = () => typeof window !== 'undefined';

const parseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (err) {
    return fallback;
  }
};

const seedAdmin = () => ({
  id: 'admin-default',
  name: 'Administrateur',
  email: 'admin@chambreanesle.fr',
  company: 'ChambreANesle',
  role: 'admin',
  password: 'Brianmathilde69@',
  createdAt: new Date().toISOString()
});

const ensureUsers = () => {
  if (!hasWindow()) return [];
  const stored = parseJson(localStorage.getItem(USER_KEY), []);
  if (stored.length) return stored;
  const defaults = [seedAdmin()];
  localStorage.setItem(USER_KEY, JSON.stringify(defaults));
  return defaults;
};

export function getUsers() {
  if (!hasWindow()) return [];
  return ensureUsers();
}

const persistUsers = (users) => {
  if (!hasWindow()) return users;
  localStorage.setItem(USER_KEY, JSON.stringify(users));
  return users;
};

export function registerUser({ name, email, password, company }) {
  if (!hasWindow()) return null;
  const users = ensureUsers();
  const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    throw new Error('Un compte existe déjà avec cet email.');
  }
  const newUser = {
    id: crypto.randomUUID(),
    name: name || 'Client',
    email,
    password,
    company: company || '',
    role: 'client',
    createdAt: new Date().toISOString()
  };
  persistUsers([...users, newUser]);
  setSession(newUser.id);
  return newUser;
}

export function adminCreateUser({ name, email, password, company, role = 'client' }) {
  if (!hasWindow()) return null;
  const safeRole = role === 'admin' ? 'admin' : 'client';
  const users = ensureUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Un compte existe déjà avec cet email.');
  }
  const newUser = {
    id: crypto.randomUUID(),
    name: name || 'Invité',
    email,
    password: password || 'ChambreANesle2024!',
    company: company || '',
    role: safeRole,
    createdAt: new Date().toISOString()
  };
  return persistUsers([...users, newUser]);
}

export function login(email, password) {
  if (!hasWindow()) return null;
  const users = ensureUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) {
    throw new Error('Identifiants incorrects.');
  }
  setSession(user.id);
  return user;
}

export function logout() {
  if (!hasWindow()) return;
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser() {
  if (!hasWindow()) return null;
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  const users = ensureUsers();
  return users.find((u) => u.id === session) || null;
}

export function setSession(userId) {
  if (!hasWindow()) return;
  localStorage.setItem(SESSION_KEY, userId);
}

export function updateUser(userId, payload) {
  if (!hasWindow()) return null;
  const users = ensureUsers();
  const updated = users.map((user) =>
    user.id === userId
      ? {
          ...user,
          ...payload,
          updatedAt: new Date().toISOString()
        }
      : user
  );
  persistUsers(updated);
  return updated.find((u) => u.id === userId) || null;
}

export function deleteUser(userId) {
  if (!hasWindow()) return [];
  const filtered = ensureUsers().filter((user) => user.id !== userId);
  return persistUsers(filtered);
}

export function requestPasswordReset(email) {
  if (!hasWindow()) return null;
  const users = ensureUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error('Aucun compte trouvé avec cet email.');
  }
  const temporaryPassword = `AN-${Math.random().toString(36).slice(2, 7)}`;
  const updatedUsers = users.map((u) =>
    u.id === user.id ? { ...u, password: temporaryPassword, passwordResetAt: new Date().toISOString() } : u
  );
  persistUsers(updatedUsers);
  const resetTokens = parseJson(localStorage.getItem(RESET_KEY), {});
  resetTokens[user.email] = {
    token: crypto.randomUUID(),
    expiresAt: Date.now() + 1000 * 60 * 60
  };
  localStorage.setItem(RESET_KEY, JSON.stringify(resetTokens));
  return { temporaryPassword, token: resetTokens[user.email].token };
}

export function resetPassword(token, newPassword) {
  if (!hasWindow()) return null;
  const tokens = parseJson(localStorage.getItem(RESET_KEY), {});
  const entry = Object.entries(tokens).find(([, value]) => value.token === token);
  if (!entry) {
    throw new Error('Lien de réinitialisation invalide.');
  }
  const [email, metadata] = entry;
  if (metadata.expiresAt < Date.now()) {
    throw new Error('Le lien a expiré.');
  }
  const users = ensureUsers();
  const updated = users.map((user) =>
    user.email === email ? { ...user, password: newPassword, updatedAt: new Date().toISOString() } : user
  );
  persistUsers(updated);
  delete tokens[email];
  localStorage.setItem(RESET_KEY, JSON.stringify(tokens));
  return updated.find((u) => u.email === email) || null;
}
