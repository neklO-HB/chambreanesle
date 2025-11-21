import { useEffect, useMemo, useState } from 'react';
import { getBookings } from '../services/api';
import { addMember, deleteMember, getMembers, getSections, upsertSection } from '../services/cms';

const ADMIN_EMAIL = 'admin@chambreanesle.fr';
const ADMIN_PASSWORD = 'Brianmathilde69@';

const tabs = [
  { key: 'overview', label: 'Vue générale', icon: 'fa-gauge' },
  { key: 'members', label: 'Membres', icon: 'fa-users' },
  { key: 'bookings', label: 'Réservations', icon: 'fa-calendar-check' },
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

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
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
                </div>
              ))}
              {!bookings.length && <p className="text-black/70">Aucune réservation pour le moment.</p>}
            </div>
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
