import { useCallback, useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import logo from '../assets/logo.svg';
import {
  getBookings,
  getCalendarSync,
  getStripeSettings,
  getRoomSnapshot,
  saveCalendarSync,
  saveStripeSettings,
  SITE_NUMBER
} from '../services/api';
import { getSections, upsertSection } from '../services/cms';
import { addRoomPhoto, getAllGalleriesSnapshot, removeRoomPhoto } from '../services/gallery';
import {
  adminCreateUser,
  deleteUser,
  getCurrentUser,
  getUsers,
  login,
  logout,
  registerUser,
  requestPasswordReset,
  updateUser
} from '../services/auth';
import { addExtra, deleteExtra, getExtras, updateExtra } from '../services/extras';
import { formatDisplayRange } from '../utils/date';
import { resetRoom, updateRoomSettings } from '../services/roomSettings';

const baseTabs = [
  { key: 'overview', label: 'Tableau de bord', icon: 'fa-gauge' },
  { key: 'settings', label: 'Paramètres', icon: 'fa-user-gear' },
  { key: 'history', label: 'Historique', icon: 'fa-clock-rotate-left' },
  { key: 'invoices', label: 'Factures', icon: 'fa-file-invoice' }
];

const adminTabs = [
  { key: 'members', label: 'Membres', icon: 'fa-users' },
  { key: 'bookings', label: 'Réservations', icon: 'fa-calendar-check' },
  { key: 'calendars', label: 'Liens iCal', icon: 'fa-link' },
  { key: 'room-eva', label: 'Eva', icon: 'fa-bed' },
  { key: 'room-sohan', label: 'Sohan', icon: 'fa-bed' },
  { key: 'room-eden', label: 'Eden', icon: 'fa-bed' },
  { key: 'extras', label: 'Services', icon: 'fa-list-check' },
  { key: 'photos', label: 'Galerie chambres', icon: 'fa-images' },
  { key: 'payments', label: 'Paiement Stripe', icon: 'fa-credit-card' },
  { key: 'cms', label: 'Pages & contenu', icon: 'fa-pen-nib' }
];

const buildRoomForms = (roomList) =>
  roomList.reduce((acc, room) => {
    acc[room.slug] = {
      name: room.name,
      price: room.price,
      description: room.description,
      highlight: room.highlight || '',
      features: room.features?.join(', ') || '',
      image: room.image || ''
    };
    return acc;
  }, {});

export default function AdminPage() {
  const [mode, setMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', company: '' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '', company: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsError, setBookingsError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stripeConfig, setStripeConfig] = useState(getStripeSettings());
  const [calendarSync, setCalendarSync] = useState(getCalendarSync());
  const [galleries, setGalleries] = useState(getAllGalleriesSnapshot());
  const [rooms, setRooms] = useState(getRoomSnapshot());
  const [roomForms, setRoomForms] = useState(() => buildRoomForms(getRoomSnapshot()));
  const [selectedGalleryRoom, setSelectedGalleryRoom] = useState(getRoomSnapshot()[0]?.slug || '');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [sectionForm, setSectionForm] = useState({ page: 'home', key: 'hero', title: '', content: '' });
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '', company: '', role: 'client' });
  const [sectionList, setSectionList] = useState(getSections());
  const [extras, setExtras] = useState(getExtras());
  const [extraForm, setExtraForm] = useState({ label: '', price: '' });
  const [editingExtraId, setEditingExtraId] = useState(null);

  const calendarLinks = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const base = window.location.origin;
    return rooms.reduce((acc, room) => ({ ...acc, [room.slug]: `${base}/calendars/${room.slug}.ical` }), {});
  }, [rooms]);

  const refreshMembers = () => {
    setMembers(getUsers());
  };

  const refreshRooms = () => {
    const snapshot = getRoomSnapshot();
    setRooms(snapshot);
    setRoomForms(buildRoomForms(snapshot));
    if (!snapshot.find((room) => room.slug === selectedGalleryRoom) && snapshot[0]) {
      setSelectedGalleryRoom(snapshot[0].slug);
    }
  };

  const refreshExtras = () => {
    setExtras(getExtras());
  };

  const refreshBookings = useCallback(
    (currentUser = user) => {
      getBookings()
        .then((list) => {
          const scoped =
            currentUser?.role === 'admin'
              ? list
              : list.filter((booking) =>
                  (booking.contact?.email || '').toLowerCase() === (currentUser?.email || '').toLowerCase()
                );
          setBookings(scoped);
          setBookingsError('');
        })
        .catch(() => setBookingsError("Impossible de charger les réservations"));
    },
    [user]
  );

  useEffect(() => {
    refreshRooms();
    refreshExtras();
  }, []);

  useEffect(() => {
    const current = getCurrentUser();
    if (current) {
      setUser(current);
      setProfileForm({
        name: current.name || '',
        email: current.email || '',
        company: current.company || '',
        password: ''
      });
      refreshMembers();
      refreshBookings(current);
      setStripeConfig(getStripeSettings());
      setGalleries(getAllGalleriesSnapshot());
      setSectionList(getSections());
      refreshRooms();
      refreshExtras();
    }
  }, [refreshBookings]);

  const handleAuthError = (err) => {
    setError(err.message || 'Une erreur est survenue.');
    setMessage('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    try {
      const loggedUser = login(authForm.email, authForm.password);
      setUser(loggedUser);
      setProfileForm({
        name: loggedUser.name || '',
        email: loggedUser.email || '',
        company: loggedUser.company || '',
        password: ''
      });
      refreshMembers();
      refreshBookings(loggedUser);
      setMessage('Connexion réussie. Bienvenue dans votre espace membre.');
      setError('');
    } catch (err) {
      handleAuthError(err);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    try {
      const registered = registerUser(authForm);
      setUser(registered);
      refreshBookings(registered);
      setMessage('Inscription réussie. Vous avez maintenant un compte client.');
      setError('');
    } catch (err) {
      handleAuthError(err);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    try {
      const reset = requestPasswordReset(authForm.email);
      setMessage(
        `Un mot de passe temporaire a été généré : ${reset.temporaryPassword}. Utilisez-le pour vous connecter puis changez-le dans vos paramètres.`
      );
      setError('');
      setMode('login');
    } catch (err) {
      handleAuthError(err);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setBookings([]);
    setMembers([]);
    setMessage('Vous êtes déconnecté.');
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (!user) return;
    const payload = {
      name: profileForm.name,
      email: profileForm.email,
      company: profileForm.company
    };
    if (profileForm.password) {
      payload.password = profileForm.password;
    }
    const updated = updateUser(user.id, payload);
    setUser(updated);
    setProfileForm({ ...profileForm, password: '' });
    setMessage('Profil mis à jour.');
    setError('');
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    try {
      adminCreateUser(newMember);
      setNewMember({ name: '', email: '', password: '', company: '', role: 'client' });
      refreshMembers();
      setMessage('Membre ajouté avec succès.');
      setError('');
    } catch (err) {
      handleAuthError(err);
    }
  };

  const handleSaveSection = (e) => {
    e.preventDefault();
    if (!sectionForm.page || !sectionForm.key) {
      setError('Page et section sont obligatoires.');
      return;
    }
    upsertSection(sectionForm);
    setSectionList(getSections());
    setMessage('Section sauvegardée.');
    setError('');
  };

  const handleSaveStripe = (e) => {
    e.preventDefault();
    const merged = saveStripeSettings(stripeConfig);
    setStripeConfig(merged);
    setMessage('Paramètres Stripe mis à jour.');
    setError('');
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const updated = addRoomPhoto(selectedGalleryRoom, { src: reader.result, caption: photoCaption });
      setGalleries((prev) => ({ ...prev, [selectedGalleryRoom]: updated }));
      setMessage('Photo ajoutée à la galerie de la chambre.');
      setPhotoCaption('');
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileUpload(file);
  };

  const handleAddPhotoUrl = (e) => {
    e.preventDefault();
    if (!photoUrl) return;
    const updated = addRoomPhoto(selectedGalleryRoom, { src: photoUrl, caption: photoCaption });
    setGalleries((prev) => ({ ...prev, [selectedGalleryRoom]: updated }));
    setMessage('Photo distante ajoutée.');
    setPhotoCaption('');
    setPhotoUrl('');
  };

  const handleRemovePhoto = (roomSlug, photoId) => {
    const updated = removeRoomPhoto(roomSlug, photoId);
    setGalleries((prev) => ({ ...prev, [roomSlug]: updated }));
  };

  const handleRoomFieldChange = (slug, field, value) => {
    setRoomForms((prev) => ({ ...prev, [slug]: { ...prev[slug], [field]: value } }));
  };

  const handleSaveRoom = (slug) => {
    const form = roomForms[slug] || {};
    updateRoomSettings(slug, {
      name: form.name,
      price: Number(form.price) || 0,
      description: form.description,
      highlight: form.highlight,
      features: (form.features || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      image: form.image
    });
    refreshRooms();
    setMessage('Chambre mise à jour.');
    setError('');
  };

  const handleResetRoom = (slug) => {
    resetRoom(slug);
    refreshRooms();
    setMessage('Paramètres de la chambre réinitialisés.');
  };

  const handleSaveExtra = (e) => {
    e.preventDefault();
    if (!extraForm.label) {
      setError('Le libellé du service est obligatoire.');
      return;
    }
    if (editingExtraId) {
      setExtras(updateExtra(editingExtraId, { label: extraForm.label, price: Number(extraForm.price) || 0 }));
    } else {
      setExtras(addExtra({ label: extraForm.label, price: Number(extraForm.price) || 0 }));
    }
    window.dispatchEvent(new Event('storage'));
    setExtraForm({ label: '', price: '' });
    setEditingExtraId(null);
    setMessage('Service supplémentaire enregistré.');
    setError('');
  };

  const handleEditExtra = (extra) => {
    setEditingExtraId(extra.id);
    setExtraForm({ label: extra.label, price: extra.price });
  };

  const handleDeleteExtra = (id) => {
    setExtras(deleteExtra(id));
    window.dispatchEvent(new Event('storage'));
  };

  const downloadInvoice = (booking) => {
    if (!booking) return;
    const nights = Math.max(1, (new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));
    const roomPrice = booking.price || booking.roomPrice || 0;
    const extras = booking.extras?.join(', ') || 'Aucun';
    const totalStay = roomPrice * nights;
    const amountPaid = booking.status === 'payée' ? totalStay : 0;
    const amountDue = Math.max(totalStay - amountPaid, 0);

    const doc = new jsPDF();
    doc.addImage(logo, 'SVG', 15, 10, 30, 30);
    doc.setFontSize(18);
    doc.text('Facture ChambreANesle', 55, 20);
    doc.setFontSize(10);
    doc.text(`N° ${booking.reservationNumber || booking.id}`, 55, 28);
    doc.text(`Site : ${SITE_NUMBER}`, 55, 34);
    doc.text('SIRET : 90182787300018', 55, 40);

    doc.setFontSize(12);
    doc.text('Client', 15, 55);
    doc.setFontSize(10);
    doc.text(`Nom : ${booking.contact?.fullName || 'Non renseigné'}`, 15, 63);
    doc.text(`Email : ${booking.contact?.email || ''}`, 15, 70);
    doc.text(`Téléphone : ${booking.contact?.phone || ''}`, 15, 77);
    doc.text(`Société : ${booking.contact?.company || '—'}`, 15, 84);

    doc.setFontSize(12);
    doc.text('Séjour', 15, 98);
    doc.setFontSize(10);
    doc.text(`Chambre : ${booking.roomName}`, 15, 106);
    doc.text(`Dates : ${formatDisplayRange(booking.startDate, booking.endDate)}`, 15, 113);
    doc.text(`Nuitées : ${nights}`, 15, 120);
    doc.text(`Extras : ${extras}`, 15, 127);
    doc.text(`Arrivée : 17h30  |  Départ : 11h30`, 15, 134);

    doc.setFontSize(12);
    doc.text('Montants', 15, 148);
    doc.setFontSize(10);
    doc.text(`Prix par nuit : ${roomPrice.toFixed(2)}€`, 15, 156);
    doc.text(`Total nuitées : ${totalStay.toFixed(2)}€`, 15, 163);
    doc.text(`Payé : ${amountPaid.toFixed(2)}€`, 15, 170);
    doc.text(`Reste à régler : ${amountDue.toFixed(2)}€`, 15, 177);

    doc.save(`facture-${booking.reservationNumber || booking.id}.pdf`);
  };

  const renderRoomEditor = (slug) => {
    const room = rooms.find((item) => item.slug === slug);
    const form = roomForms[slug] || {};
    if (!room) {
      return <p className="text-black">Chambre introuvable.</p>;
    }

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-black/60">{room.name}</p>
            <h2 className="text-2xl font-bold text-black">Configuration</h2>
          </div>
          <span className="text-sm bg-primary/20 rounded-full px-3 py-1 border border-black/10">Slug : {room.slug}</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-black">Nom</label>
            <input
              className="w-full border border-black/10 rounded-lg px-3 py-2"
              value={form.name || ''}
              onChange={(e) => handleRoomFieldChange(slug, 'name', e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-black">Prix / nuit (€)</label>
            <input
              className="w-full border border-black/10 rounded-lg px-3 py-2"
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => handleRoomFieldChange(slug, 'price', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-semibold text-black">Description</label>
          <textarea
            className="w-full border border-black/10 rounded-lg px-3 py-2"
            value={form.description || ''}
            onChange={(e) => handleRoomFieldChange(slug, 'description', e.target.value)}
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-semibold text-black">Mise en avant</label>
          <input
            className="w-full border border-black/10 rounded-lg px-3 py-2"
            value={form.highlight || ''}
            onChange={(e) => handleRoomFieldChange(slug, 'highlight', e.target.value)}
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-semibold text-black">Options (séparées par des virgules)</label>
          <textarea
            className="w-full border border-black/10 rounded-lg px-3 py-2"
            value={form.features || ''}
            onChange={(e) => handleRoomFieldChange(slug, 'features', e.target.value)}
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-semibold text-black">Photo principale</label>
          <input
            className="w-full border border-black/10 rounded-lg px-3 py-2"
            placeholder="https://..."
            value={form.image || ''}
            onChange={(e) => handleRoomFieldChange(slug, 'image', e.target.value)}
          />
          {form.image && (
            <img src={form.image} alt={form.name} className="w-full h-48 object-cover rounded-lg border border-black/10" />
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="bg-black text-white rounded-lg px-4 py-2 font-semibold"
            onClick={() => handleSaveRoom(slug)}
          >
            Sauvegarder
          </button>
          <button
            type="button"
            className="bg-white border border-black/20 text-black rounded-lg px-4 py-2 font-semibold"
            onClick={() => handleResetRoom(slug)}
          >
            Réinitialiser
          </button>
        </div>
      </div>
    );
  };

  const visibleTabs = user?.role === 'admin' ? [...baseTabs, ...adminTabs] : baseTabs;

  const renderAuthForms = () => (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl p-10 grid md:grid-cols-2 gap-8">
        <div>
          <p className="badge bg-black text-white uppercase tracking-widest mb-3">Espace membre</p>
          <h1 className="text-3xl font-bold mb-2 text-black">ChambreANesle</h1>
          <p className="text-black/80 mb-6">
            Connectez-vous ou créez un compte client pour accéder à vos paramètres, vos factures et votre historique de
            commandes.
          </p>
          <div className="bg-primary/10 rounded-xl p-4 text-sm text-black">
            <p className="font-semibold mb-2">Nouveau mot de passe ?</p>
            <p>Utilisez l’option « Mot de passe oublié » pour générer un accès temporaire et sécuriser votre compte.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 font-semibold ${
                mode === 'login' ? 'bg-primary text-white' : 'bg-black/5 text-black'
              }`}
              onClick={() => setMode('login')}
            >
              Connexion
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 font-semibold ${
                mode === 'register' ? 'bg-primary text-white' : 'bg-black/5 text-black'
              }`}
              onClick={() => setMode('register')}
            >
              Inscription
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 font-semibold ${
                mode === 'forgot' ? 'bg-primary text-white' : 'bg-black/5 text-black'
              }`}
              onClick={() => setMode('forgot')}
            >
              Mot de passe oublié
            </button>
          </div>

          {message && <div className="bg-green-100 border border-green-200 rounded-xl p-3 text-green-800">{message}</div>}
          {error && <div className="bg-red-100 border border-red-200 rounded-xl p-3 text-red-800">{error}</div>}

          {mode === 'login' && (
            <form className="space-y-3" onSubmit={handleLogin}>
              <input
                className="w-full border border-black/10 rounded-lg px-4 py-3"
                placeholder="Email"
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
              <input
                className="w-full border border-black/10 rounded-lg px-4 py-3"
                placeholder="Mot de passe"
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
              <button type="submit" className="w-full bg-black text-white rounded-lg py-3 font-semibold cta-button">
                Se connecter
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form className="space-y-3" onSubmit={handleRegister}>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-3"
                  placeholder="Nom complet"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  required
                />
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-3"
                  placeholder="Nom de l’entreprise (optionnel)"
                  value={authForm.company}
                  onChange={(e) => setAuthForm({ ...authForm, company: e.target.value })}
                />
              </div>
              <input
                className="w-full border border-black/10 rounded-lg px-4 py-3"
                placeholder="Email"
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
              <input
                className="w-full border border-black/10 rounded-lg px-4 py-3"
                placeholder="Mot de passe"
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
              <button type="submit" className="w-full bg-black text-white rounded-lg py-3 font-semibold cta-button">
                Créer mon compte
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form className="space-y-3" onSubmit={handleForgotPassword}>
              <input
                className="w-full border border-black/10 rounded-lg px-4 py-3"
                placeholder="Email associé au compte"
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
              <button type="submit" className="w-full bg-black text-white rounded-lg py-3 font-semibold cta-button">
                Générer un mot de passe temporaire
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  if (!user) return renderAuthForms();

  return (
    <div className="bg-primary min-h-screen py-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
          <div>
            <p className="text-sm uppercase tracking-widest text-black">Bienvenue {user.name || user.email}</p>
            <h1 className="text-3xl font-bold text-black">Espace membre ChambreANesle</h1>
            <p className="text-black/70">{user.role === 'admin' ? 'Accès complet au panneau d’administration.' : 'Gérez vos informations et vos documents en quelques clics.'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white border border-black/10 text-sm font-semibold capitalize">{user.role}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-white border border-black text-black font-semibold"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        {message && <div className="bg-white/80 border border-black/10 rounded-xl p-3 mb-4 text-black">{message}</div>}
        {error && <div className="bg-red-100 border border-red-200 rounded-xl p-3 mb-4 text-red-800">{error}</div>}

        <div className="flex flex-wrap gap-2 mb-6">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full border font-semibold flex items-center gap-2 ${
                activeTab === tab.key ? 'bg-black text-white border-black' : 'bg-white text-black border-black/10'
              }`}
            >
              <i className={`fas ${tab.icon}`} aria-hidden />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="admin-grid">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <p className="text-sm text-black/60">Réservations</p>
              <p className="text-3xl font-bold">{bookings.length}</p>
              <p className="text-sm text-black/60">{user.role === 'admin' ? 'Planning global' : 'Historique personnel'}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <p className="text-sm text-black/60">Compte</p>
              <p className="text-3xl font-bold">{user.role === 'admin' ? 'Administrateur' : 'Client'}</p>
              <p className="text-sm text-black/60">Rôle actif</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <p className="text-sm text-black/60">Chambres synchronisées</p>
              <p className="text-3xl font-bold">{Object.keys(calendarSync).length || rooms.length}</p>
              <p className="text-sm text-black/60">Flux iCal disponibles par chambre</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5 grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Mettre à jour mon compte</h2>
              <form className="space-y-3" onSubmit={handleProfileSave}>
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-3"
                  placeholder="Nom complet"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-3"
                  placeholder="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-3"
                  placeholder="Nom de l’entreprise"
                  value={profileForm.company}
                  onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                />
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-3"
                  placeholder="Nouveau mot de passe (optionnel)"
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                />
                <button type="submit" className="w-full bg-black text-white rounded-lg py-3 font-semibold cta-button">
                  Enregistrer les modifications
                </button>
              </form>
            </div>
            <div className="bg-primary/10 rounded-xl p-4 border border-black/10">
              <h3 className="text-lg font-bold text-black mb-2">Besoin d’aide ?</h3>
              <p className="text-black/70">Contactez notre équipe pour toute question sur votre compte ou vos documents.</p>
              <a className="block font-semibold text-black mt-3" href="mailto:dupuisbrian80@outlook.fr">
                dupuisbrian80@outlook.fr
              </a>
              <a className="block font-semibold text-black" href="tel:0648939733">0648939733</a>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-black/60">Historique</p>
                <h2 className="text-2xl font-bold text-black">Vos réservations</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-sm font-semibold">{bookings.length} séjour(s)</span>
            </div>
            {!bookings.length && <p className="text-black/60">Aucune réservation associée à ce compte pour le moment.</p>}
            <div className="grid md:grid-cols-2 gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border border-black/10 rounded-lg p-4 bg-primary/10">
                  <p className="font-semibold">{booking.roomName}</p>
                  <p className="text-sm text-black/70">{formatDisplayRange(booking.startDate, booking.endDate)}</p>
                  <p className="text-sm text-black/70">{booking.guests} hôtes</p>
                  {!!booking.extras?.length && (
                    <p className="text-xs text-black/60">Extras : {booking.extras.join(', ')}</p>
                  )}
                  <span className="mt-2 inline-block text-xs bg-white border border-black/10 rounded-full px-3 py-1">{booking.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-black/60">Documents</p>
                <h2 className="text-2xl font-bold text-black">Factures disponibles</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-sm font-semibold">{bookings.length} séjour(s)</span>
            </div>
            {!bookings.length && <p className="text-black/60">Aucune facture à afficher. Réservez une chambre pour générer vos documents.</p>}
            <div className="grid md:grid-cols-2 gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border border-black/10 rounded-lg p-4 bg-primary/10 flex flex-col gap-2">
                  <p className="font-semibold">{booking.roomName}</p>
                  <p className="text-sm text-black/70">Séjour du {formatDisplayRange(booking.startDate, booking.endDate)}</p>
                  <button
                    type="button"
                    className="self-start bg-black text-white rounded-full px-3 py-2 text-sm"
                    onClick={() => downloadInvoice(booking)}
                  >
                    Télécharger la facture
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'members' && user.role === 'admin' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black">Membres</h2>
                <span className="text-sm text-black/60">{members.length} comptes</span>
              </div>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-black/70">{member.email}</p>
                      {member.company && <p className="text-xs text-black/60">{member.company}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-white border border-black/10 rounded-full px-3 py-1 capitalize">{member.role}</span>
                      {member.id !== 'admin-default' && (
                        <button
                          type="button"
                          className="text-red-600 text-sm"
                          onClick={() => setMembers(deleteUser(member.id))}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <h3 className="text-lg font-bold text-black mb-4">Ajouter un membre</h3>
              <form className="space-y-3" onSubmit={handleAddMember}>
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-2"
                  placeholder="Nom complet"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  required
                />
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-2"
                  placeholder="Email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  required
                />
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-2"
                  placeholder="Mot de passe"
                  type="password"
                  value={newMember.password}
                  onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                />
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-2"
                  placeholder="Entreprise (optionnel)"
                  value={newMember.company}
                  onChange={(e) => setNewMember({ ...newMember, company: e.target.value })}
                />
                <select
                  className="w-full border border-black/10 rounded-lg px-4 py-2"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                >
                  <option value="client">Client</option>
                  <option value="admin">Administrateur</option>
                </select>
                <button type="submit" className="w-full bg-black text-white rounded-lg py-2 font-semibold cta-button">
                  Enregistrer le membre
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && user.role === 'admin' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-black/60">Réservations</p>
                <h2 className="text-2xl font-bold text-black">Planning en cours</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-sm font-semibold">{bookings.length} dossiers</span>
            </div>
            {bookingsError && <p className="text-red-600 mb-3">{bookingsError}</p>}
            <div className="grid md:grid-cols-2 gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border border-black/10 rounded-lg p-4 bg-primary/10">
                  <p className="font-semibold">{booking.roomName}</p>
                  <p className="text-sm text-black/70">{formatDisplayRange(booking.startDate, booking.endDate)}</p>
                  <p className="text-sm text-black/70">{booking.guests} hôtes</p>
                  {!!booking.extras?.length && (
                    <p className="text-xs text-black/60">Extras : {booking.extras.join(', ')}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-white border border-black/10 rounded-full px-3 py-1">{booking.status}</span>
                    {booking.status === 'payée' && (
                      <button
                        type="button"
                        className="text-xs bg-black text-white rounded-full px-3 py-1"
                        onClick={() => downloadInvoice(booking)}
                      >
                        Générer la facture
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!bookings.length && <p className="text-black/70">Aucune réservation pour le moment.</p>}
            </div>
            <p className="text-xs text-black/60 mt-4">
              Besoin des exports pour Airbnb ou Google Agenda ? Rendez-vous dans l’onglet « Liens iCal ».
            </p>
          </div>
        )}

        {activeTab === 'calendars' && user.role === 'admin' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-primary/10 rounded-lg p-4 border border-black/10">
                <h3 className="font-bold mb-2">Lien Airbnb existant</h3>
                <p className="text-sm text-black/70 mb-3">Conservez ici l’URL iCal fournie par Airbnb pour suivre les blocs croisés.</p>
                <select
                  className="w-full border border-black/10 rounded-lg px-3 py-2 mb-3"
                  value={selectedGalleryRoom}
                  onChange={(e) => setSelectedGalleryRoom(e.target.value)}
                >
                  {rooms.map((room) => (
                    <option key={room.slug} value={room.slug}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full border border-black/10 rounded-lg px-3 py-2 mb-2"
                  placeholder="Lien iCal Airbnb"
                  value={calendarSync[selectedGalleryRoom]?.airbnbUrl || ''}
                  onChange={(e) => setCalendarSync(saveCalendarSync(selectedGalleryRoom, e.target.value))}
                />
                <p className="text-xs text-black/60">Ce lien est sauvegardé pour chaque chambre.</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 border border-black/10">
                <h3 className="font-bold mb-2">Lien .ical ChambreANesle</h3>
                <p className="text-sm text-black/70 mb-3">Copiez l’URL ci-dessous et collez-la dans Airbnb ou Google Agenda.</p>
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div key={room.slug} className="bg-white rounded-lg border border-black/10 p-3 flex items-center justify-between gap-2">
                      <div className="text-sm text-black">
                        <p className="font-semibold">{room.name}</p>
                        <p className="break-all text-xs text-black/70">{calendarLinks[room.slug]}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <a
                          className="text-xs bg-black text-white rounded-full px-3 py-1"
                          href={calendarLinks[room.slug]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ouvrir
                        </a>
                        <button
                          type="button"
                          className="text-xs bg-white border border-black/20 rounded-full px-3 py-1"
                          onClick={() => navigator.clipboard?.writeText(calendarLinks[room.slug])}
                        >
                          Copier le lien
                        </button>
                      </div>
                    </div>
                  ))}
                  {!rooms.length && <p className="text-sm text-black/70">Aucune chambre disponible.</p>}
                </div>
                <p className="text-xs text-black/60 mt-2">Chaque URL se termine par .ical pour être reconnue par Airbnb.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'room-eva' && user.role === 'admin' && renderRoomEditor('eva')}
        {activeTab === 'room-sohan' && user.role === 'admin' && renderRoomEditor('sohan')}
        {activeTab === 'room-eden' && user.role === 'admin' && renderRoomEditor('eden')}

        {activeTab === 'extras' && user.role === 'admin' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5 grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-black mb-3">Services supplémentaires</h3>
              <p className="text-sm text-black/70 mb-4">
                Ajoutez, modifiez ou supprimez les options proposées dans le formulaire de réservation.
              </p>
              <ul className="space-y-3">
                {extras.map((extra) => (
                  <li
                    key={extra.id}
                    className="border border-black/10 rounded-lg p-3 flex items-center justify-between bg-primary/10"
                  >
                    <div>
                      <p className="font-semibold">{extra.label}</p>
                      <p className="text-sm text-black/70">{Number(extra.price || 0).toFixed(2)}€</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs bg-white border border-black/20 rounded-full px-3 py-1"
                        onClick={() => handleEditExtra(extra)}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="text-xs bg-red-600 text-white rounded-full px-3 py-1"
                        onClick={() => handleDeleteExtra(extra.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                ))}
                {!extras.length && <p className="text-sm text-black/70">Aucun service enregistré pour le moment.</p>}
              </ul>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 border border-black/10">
              <h4 className="text-lg font-bold text-black mb-3">Ajouter ou mettre à jour</h4>
              <form className="space-y-3" onSubmit={handleSaveExtra}>
                <input
                  className="w-full border border-black/10 rounded-lg px-3 py-2"
                  placeholder="Libellé du service"
                  value={extraForm.label}
                  onChange={(e) => setExtraForm({ ...extraForm, label: e.target.value })}
                />
                <input
                  className="w-full border border-black/10 rounded-lg px-3 py-2"
                  placeholder="Tarif (€)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={extraForm.price}
                  onChange={(e) => setExtraForm({ ...extraForm, price: e.target.value })}
                />
                <button type="submit" className="w-full bg-black text-white rounded-lg py-2 font-semibold cta-button">
                  {editingExtraId ? 'Mettre à jour le service' : 'Ajouter le service'}
                </button>
                {editingExtraId && (
                  <button
                    type="button"
                    className="w-full bg-white border border-black/10 rounded-lg py-2 font-semibold"
                    onClick={() => {
                      setEditingExtraId(null);
                      setExtraForm({ label: '', price: '' });
                    }}
                  >
                    Annuler la modification
                  </button>
                )}
              </form>
            </div>
          </div>
        )}

        {activeTab === 'photos' && user.role === 'admin' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <h3 className="text-xl font-bold text-black mb-4">Ajouter une photo</h3>
              <form className="space-y-3" onSubmit={handleAddPhotoUrl}>
                <div>
                  <label className="text-sm font-semibold text-black">Chambre</label>
                <select
                  className="w-full border border-black/10 rounded-lg px-3 py-2"
                  value={selectedGalleryRoom}
                  onChange={(e) => setSelectedGalleryRoom(e.target.value)}
                >
                  {rooms.map((room) => (
                    <option key={room.slug} value={room.slug}>
                      {room.name}
                    </option>
                  ))}
                </select>
                </div>
                <input
                  className="w-full border border-black/10 rounded-lg px-3 py-2"
                  placeholder="Légende (facultatif)"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                />
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Importer depuis l’ordinateur</label>
                  <input type="file" accept="image/*" onChange={handlePhotoInput} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Ou coller une URL d’image</label>
                  <input
                    className="w-full border border-black/10 rounded-lg px-3 py-2"
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full bg-black text-white rounded-lg py-2 font-semibold cta-button">
                  Ajouter à la galerie
                </button>
              </form>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <h3 className="text-xl font-bold text-black mb-4">Galeries</h3>
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {rooms.map((room) => (
                  <div key={room.slug} className="border border-black/10 rounded-lg p-3 bg-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-black">{room.name}</p>
                      <span className="text-xs bg-white border border-black/10 rounded-full px-3 py-1">
                        {(galleries[room.slug] || []).length} photo(s)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(galleries[room.slug] || []).map((photo) => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-black/5">
                          <img src={photo.src} alt={photo.caption || room.name} className="w-full h-24 object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(room.slug, photo.id)}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100"
                          >
                            <i className="fas fa-times" aria-hidden />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && user.role === 'admin' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
            <h3 className="text-xl font-bold text-black mb-4">Configurer Stripe</h3>
            <form className="grid md:grid-cols-2 gap-4" onSubmit={handleSaveStripe}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-black">Activation Stripe</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={stripeConfig.enableStripe}
                    onChange={(e) => setStripeConfig({ ...stripeConfig, enableStripe: e.target.checked })}
                  />
                  <span>Activer le paiement en ligne</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-black">Publishable key</label>
                <input
                  className="w-full border border-black/10 rounded-lg px-3 py-2"
                  value={stripeConfig.publishableKey}
                  onChange={(e) => setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })}
                  placeholder="pk_live_..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-black">Secret key</label>
                <input
                  className="w-full border border-black/10 rounded-lg px-3 py-2"
                  value={stripeConfig.secretKey}
                  onChange={(e) => setStripeConfig({ ...stripeConfig, secretKey: e.target.value })}
                  placeholder="sk_live_..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-black">Emails de notification Stripe</label>
                <input
                  className="w-full border border-black/10 rounded-lg px-3 py-2"
                  value={(stripeConfig.webhookEmails || []).join(', ')}
                  onChange={(e) =>
                    setStripeConfig({
                      ...stripeConfig,
                      webhookEmails: e.target.value
                        .split(',')
                        .map((mail) => mail.trim())
                        .filter(Boolean)
                    })
                  }
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              <button type="submit" className="bg-black text-white rounded-lg py-3 font-semibold cta-button md:col-span-2">
                Sauvegarder les paramètres
              </button>
            </form>
          </div>
        )}

        {activeTab === 'cms' && user.role === 'admin' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <h3 className="text-xl font-bold text-black mb-4">Éditer une section</h3>
              <form className="space-y-3" onSubmit={handleSaveSection}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-black">Page</label>
                    <input
                      className="w-full border border-black/10 rounded-lg px-3 py-2"
                      placeholder="home, chambres, contact..."
                      value={sectionForm.page}
                      onChange={(e) => setSectionForm({ ...sectionForm, page: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-black">Section</label>
                    <input
                      className="w-full border border-black/10 rounded-lg px-3 py-2"
                      placeholder="hero, slider, bloc-1"
                      value={sectionForm.key}
                      onChange={(e) => setSectionForm({ ...sectionForm, key: e.target.value })}
                    />
                  </div>
                </div>
                <input
                  className="w-full border border-black/10 rounded-lg px-3 py-2"
                  placeholder="Titre"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                />
                <textarea
                  className="w-full border border-black/10 rounded-lg px-3 py-2 min-h-[120px]"
                  placeholder="Contenu ou corps de texte"
                  value={sectionForm.content}
                  onChange={(e) => setSectionForm({ ...sectionForm, content: e.target.value })}
                />
                <button type="submit" className="w-full bg-black text-white rounded-lg py-2 font-semibold cta-button">
                  Sauvegarder la section
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <h3 className="text-xl font-bold text-black mb-4">Contenus enregistrés</h3>
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                {sectionList.map((section) => (
                  <div key={`${section.page}-${section.key}`} className="border border-black/10 rounded-lg p-3 bg-primary/10">
                    <p className="text-xs uppercase tracking-widest text-black/70">{section.page} • {section.key}</p>
                    <p className="font-semibold">{section.title || 'Titre non défini'}</p>
                    <p className="text-sm text-black/70 whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
                {!sectionList.length && <p className="text-black/60">Aucune section personnalisée encore enregistrée.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
