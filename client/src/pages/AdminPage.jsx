import { useEffect, useMemo, useState } from 'react';
import {
  generateICal,
  getBookings,
  getCalendarSync,
  getStripeSettings,
  rooms as roomOptions,
  saveCalendarSync,
  saveStripeSettings
} from '../services/api';
import { addMember, deleteMember, getMembers, getSections, upsertSection } from '../services/cms';
import { addRoomPhoto, getAllGalleriesSnapshot, removeRoomPhoto } from '../services/gallery';

const ADMIN_EMAIL = 'admin@chambreanesle.fr';
const ADMIN_PASSWORD = 'Brianmathilde69@';

const tabs = [
  { key: 'overview', label: 'Vue générale', icon: 'fa-gauge' },
  { key: 'members', label: 'Membres', icon: 'fa-users' },
  { key: 'bookings', label: 'Réservations', icon: 'fa-calendar-check' },
  { key: 'photos', label: 'Galerie chambres', icon: 'fa-images' },
  { key: 'payments', label: 'Paiement Stripe', icon: 'fa-credit-card' },
  { key: 'cms', label: 'Pages & contenu', icon: 'fa-pen-nib' }
];

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsError, setBookingsError] = useState('');
  const [formMember, setFormMember] = useState({ name: '', email: '', phone: '', role: 'Voyageur' });
  const [sectionForm, setSectionForm] = useState({ page: 'home', key: 'hero', title: '', content: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stripeConfig, setStripeConfig] = useState(getStripeSettings());
  const [calendarSync, setCalendarSync] = useState(getCalendarSync());
  const [galleries, setGalleries] = useState(getAllGalleriesSnapshot());
  const [selectedGalleryRoom, setSelectedGalleryRoom] = useState(roomOptions[0]?.slug || '');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const sectionList = useMemo(() => getSections(), [token, sectionForm]);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    setMembers(getMembers());
    getBookings()
      .then(setBookings)
      .catch(() => setBookingsError("Impossible de charger les réservations"));
    setStripeConfig(getStripeSettings());
    setGalleries(getAllGalleriesSnapshot());
  }, [token]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const authToken = btoa(`${email}:${Date.now()}`);
      localStorage.setItem('adminToken', authToken);
      setToken(authToken);
      setError('');
      setMessage('Connexion réussie. Bienvenue dans le panneau de gestion.');
    } else {
      setError('Identifiants incorrects.');
    }
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!formMember.name || !formMember.email) {
      setError('Merci de renseigner un nom et un email pour le membre.');
      return;
    }
    const updated = addMember(formMember);
    setMembers(updated);
    setFormMember({ name: '', email: '', phone: '', role: 'Voyageur' });
    setMessage('Membre ajouté avec succès.');
    setError('');
  };

  const handleSaveSection = (e) => {
    e.preventDefault();
    if (!sectionForm.page || !sectionForm.key) {
      setError('Page et section sont obligatoires.');
      return;
    }
    upsertSection(sectionForm);
    setMessage('Section sauvegardée. Elle sera utilisée comme contenu personnalisé.');
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

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
  };

  const downloadInvoice = (booking) => {
    if (!booking) return;
    const nights = Math.max(
      1,
      (new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)
    );
    const totalNights = nights * (booking.price || booking.roomPrice || 0);
    const extras = booking.extras?.join(', ') || 'Aucun';
    const content = `Facture ChambreANesle\n\nClient : ${booking.contact?.fullName || ''}\nSociété : ${
      booking.contact?.company || '—'
    }\nEmail : ${booking.contact?.email || ''}\nTéléphone : ${booking.contact?.phone || ''}\n\nSéjour : ${
      booking.roomName
    } du ${booking.startDate} au ${booking.endDate}\nNombre de nuits : ${nights}\nExtras : ${extras}\nSIRET : 90182787300018\nTotal estimatif : ${totalNights}€`; 
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facture-${booking.reservationNumber || booking.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-8">
          <p className="badge bg-black text-white uppercase tracking-widest mb-4">Espace administration</p>
          <h1 className="text-3xl font-bold mb-2 text-black">ChambreANesle</h1>
          <p className="text-black/80 mb-6">Connectez-vous pour gérer vos pages, membres et réservations.</p>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-black mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-black/10 px-4 py-3"
                placeholder="admin@chambreanesle.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-1">Mot de passe</label>
              <input
                type="password"
                className="w-full rounded-lg border border-black/10 px-4 py-3"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-black text-white rounded-lg py-3 font-semibold cta-button"
            >
              Se connecter
            </button>
          </form>
          <div className="mt-4 text-xs text-black/60">
            <p>Email : {ADMIN_EMAIL}</p>
            <p>Mot de passe : {ADMIN_PASSWORD}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary min-h-screen py-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
          <div>
            <p className="text-sm uppercase tracking-widest text-black">Tableau de bord</p>
            <h1 className="text-3xl font-bold text-black">Espace membre ChambreANesle</h1>
            <p className="text-black/70">Pilotez vos contenus, vos membres et vos réservations depuis une interface unique.</p>
          </div>
          <div className="flex items-center gap-3">
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
          {tabs.map((tab) => (
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
              <p className="text-sm text-black/60">Membres actifs</p>
              <p className="text-3xl font-bold">{members.length}</p>
              <p className="text-sm text-black/60">Comptes voyageurs ou administrateurs</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <p className="text-sm text-black/60">Réservations</p>
              <p className="text-3xl font-bold">{bookings.length}</p>
              <p className="text-sm text-black/60">Synchronisé avec votre planning</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <p className="text-sm text-black/60">Sections éditables</p>
              <p className="text-3xl font-bold">{sectionList.length}</p>
              <p className="text-sm text-black/60">Mises à jour depuis l\'interface</p>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
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
                      {member.phone && <p className="text-xs text-black/60">{member.phone}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-white border border-black/10 rounded-full px-3 py-1">{member.role}</span>
                      <button
                        type="button"
                        className="text-red-600 text-sm"
                        onClick={() => setMembers(deleteMember(member.id))}
                      >
                        Supprimer
                      </button>
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
                  value={formMember.name}
                  onChange={(e) => setFormMember({ ...formMember, name: e.target.value })}
                />
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-2"
                  placeholder="Email"
                  type="email"
                  value={formMember.email}
                  onChange={(e) => setFormMember({ ...formMember, email: e.target.value })}
                />
                <input
                  className="w-full border border-black/10 rounded-lg px-4 py-2"
                  placeholder="Téléphone"
                  value={formMember.phone}
                  onChange={(e) => setFormMember({ ...formMember, phone: e.target.value })}
                />
                <select
                  className="w-full border border-black/10 rounded-lg px-4 py-2"
                  value={formMember.role}
                  onChange={(e) => setFormMember({ ...formMember, role: e.target.value })}
                >
                  <option>Voyageur</option>
                  <option>Administrateur</option>
                  <option>Partenaire</option>
                </select>
                <button type="submit" className="w-full bg-black text-white rounded-lg py-2 font-semibold cta-button">
                  Enregistrer le membre
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-primary/10 rounded-lg p-4 border border-black/10">
                <h3 className="font-bold mb-2">Synchronisation Airbnb (iCal)</h3>
                <p className="text-sm text-black/70 mb-3">Collez le lien iCal Airbnb pour la chambre sélectionnée.</p>
                <select
                  className="w-full border border-black/10 rounded-lg px-3 py-2 mb-3"
                  value={selectedGalleryRoom}
                  onChange={(e) => setSelectedGalleryRoom(e.target.value)}
                >
                  {roomOptions.map((room) => (
                    <option key={room.slug} value={room.slug}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full border border-black/10 rounded-lg px-3 py-2 mb-2"
                  placeholder="Lien iCal Airbnb"
                  value={calendarSync[selectedGalleryRoom]?.airbnbUrl || ''}
                  onChange={(e) =>
                    setCalendarSync(saveCalendarSync(selectedGalleryRoom, e.target.value))
                  }
                />
                <p className="text-xs text-black/60">Les nouvelles réservations seront ajoutées à votre export iCal interne.</p>
              </div>

              <div className="bg-primary/10 rounded-lg p-4 border border-black/10">
                <h3 className="font-bold mb-2">iCal ChambreANesle</h3>
                <p className="text-sm text-black/70">Copiez ce flux et importez-le dans vos calendriers.</p>
                <textarea
                  className="w-full border border-black/10 rounded-lg px-3 py-2 text-xs h-32"
                  readOnly
                  value={generateICal(selectedGalleryRoom)}
                />
              </div>
            </div>
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
                  <p className="text-sm text-black/70">{booking.startDate} → {booking.endDate}</p>
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
          </div>
        )}

        {activeTab === 'photos' && (
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
                    {roomOptions.map((room) => (
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
                  <label className="text-sm font-semibold text-black">Importer depuis l'ordinateur</label>
                  <input type="file" accept="image/*" onChange={handlePhotoInput} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Ou coller une URL d'image</label>
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
                {roomOptions.map((room) => (
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

        {activeTab === 'payments' && (
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
                  onChange={(e) => setStripeConfig({ ...stripeConfig, webhookEmails: e.target.value.split(',').map((mail) => mail.trim()).filter(Boolean) })}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              <button type="submit" className="bg-black text-white rounded-lg py-3 font-semibold cta-button md:col-span-2">
                Sauvegarder les paramètres
              </button>
            </form>
          </div>
        )}

        {activeTab === 'cms' && (
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
