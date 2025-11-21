import { useEffect, useMemo, useState } from 'react';
import {
  completeStripePayment,
  createBooking,
  getBookings,
  getContactDetails,
  getExtrasForForm,
  getStripeSettings
} from '../services/api';
import BookingCalendar from './BookingCalendar';
import { formatDisplayRange } from '../utils/date';

const formatCurrency = (value) => `${value.toFixed(2)}€`;

export default function BookingForm({ rooms }) {
  const [roomSlug, setRoomSlug] = useState(rooms[0]?.slug || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [extras, setExtras] = useState({});
  const [availableExtras, setAvailableExtras] = useState(() => getExtrasForForm());
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [activeBooking, setActiveBooking] = useState(null);
  const [stripeSettings, setStripeSettings] = useState(() => getStripeSettings());
  const [contact, setContact] = useState({ fullName: '', email: '', phone: '', company: '' });

  useEffect(() => {
    getBookings()
      .then(setBookings)
      .catch(() => setBookings([]));
  }, []);

  useEffect(() => {
    const refreshExtras = () => setAvailableExtras(getExtrasForForm());
    refreshExtras();
    window.addEventListener('storage', refreshExtras);
    return () => window.removeEventListener('storage', refreshExtras);
  }, []);

  useEffect(() => {
    setExtras((prev) => {
      const next = {};
      availableExtras.forEach((extra) => {
        next[extra.id] = prev[extra.id] || false;
      });
      return next;
    });
  }, [availableExtras]);

  useEffect(() => {
    if (!roomSlug && rooms[0]?.slug) {
      setRoomSlug(rooms[0].slug);
    }
  }, [rooms, roomSlug]);

  const selectedRoom = useMemo(() => rooms.find((room) => room.slug === roomSlug), [rooms, roomSlug]);
  const bookedRanges = useMemo(
    () => bookings.map((booking) => ({ start: booking.startDate, end: booking.endDate, roomSlug: booking.roomSlug })),
    [bookings]
  );

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    return Math.max(0, diff);
  }, [startDate, endDate]);

  const extrasCost = useMemo(() => {
    const count = availableExtras.reduce((sum, extra) => (extras[extra.id] ? sum + Number(extra.price || 0) : sum), 0);
    return count * guests;
  }, [availableExtras, extras, guests]);

  const total = useMemo(() => {
    if (!selectedRoom || !nights) return null;
    const base = nights * selectedRoom.price;
    const taxes = base * 0.05;
    return {
      nights,
      base,
      extrasCost,
      taxes,
      total: base + extrasCost + taxes
    };
  }, [extrasCost, nights, selectedRoom]);

  const toggleExtra = (key) => {
    setExtras((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDatesChange = ({ start, end }) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom || !startDate || !endDate) {
      setStatus({ type: 'error', message: 'Choisissez une chambre et un créneau avant de valider.' });
      return;
    }
    setStatus({ type: 'loading', message: '' });

    try {
      const selectedExtras = availableExtras.filter((extra) => extras[extra.id]).map((extra) => extra.label);
      const newBooking = await createBooking({
        roomSlug,
        startDate,
        endDate,
        guests,
        extras: selectedExtras,
        contact
      });
      setBookings((prev) => [...prev, newBooking]);
      setActiveBooking(newBooking);
      setStatus({
        type: 'success',
        message: `Réservation ${newBooking.reservationNumber} enregistrée. Vous pouvez procéder au paiement Stripe.`
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Impossible de créer la réservation.' });
    }
  };

  const handleStripePayment = async () => {
    if (!activeBooking) return;
    setStatus({ type: 'loading', message: 'Redirection vers Stripe en cours...' });
    try {
      const paid = await completeStripePayment(activeBooking.id);
      setBookings((prev) => prev.map((booking) => (booking.id === paid.id ? paid : booking)));
      setActiveBooking(paid);
      setStatus({
        type: 'success',
        message: `Paiement validé pour ${paid.reservationNumber}. Un récapitulatif est envoyé à ${(
          paid.notifications || []
        ).join(', ')}.`
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Le paiement a échoué.' });
    }
  };

  const contactDetails = getContactDetails();

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <form className="lg:col-span-2 space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-black">Choisissez votre chambre</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {rooms.map((room) => (
                <label
                  key={room.slug}
                  className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary ${
                    roomSlug === room.slug ? 'border-primary bg-primary/10' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="room"
                    value={room.slug}
                    checked={roomSlug === room.slug}
                    onChange={(e) => setRoomSlug(e.target.value)}
                    className="h-5 w-5 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-black">{room.name}</p>
                    <p className="text-sm text-black/70">{room.highlight || room.description}</p>
                    <p className="text-sm font-semibold mt-1">{room.price}€ / nuit</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <BookingCalendar
              startDate={startDate}
              endDate={endDate}
              roomSlug={roomSlug}
              bookedRanges={bookedRanges}
              onChange={handleDatesChange}
            />
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-black">
              <p className="font-semibold">Séjour par nuitée</p>
              <p className="text-sm">Arrivée à partir de 17h30 · Départ jusqu'à 11h30</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-black">Voyageurs</h3>
              <label className="block text-sm font-semibold text-black">Nombre de personnes</label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {[1, 2, 3, 4].map((count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? 'personne' : 'personnes'}
                  </option>
                ))}
              </select>
              <div>
                <p className="text-sm font-semibold text-black">Services supplémentaires</p>
                <div className="space-y-2 mt-2">
                  {availableExtras.map((extra) => (
                    <label key={extra.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={extras[extra.id]}
                        onChange={() => toggleExtra(extra.id)}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <span className="ml-2 text-black">{extra.label}</span>
                    </label>
                  ))}
                  {!availableExtras.length && <p className="text-sm text-black/70">Aucun service additionnel configuré.</p>}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-black">Coordonnées</h3>
              <input
                className="w-full border border-black/10 rounded-lg px-4 py-2"
                placeholder="Nom et prénom"
                value={contact.fullName}
                onChange={(e) => setContact({ ...contact, fullName: e.target.value })}
              />
              <input
                className="w-full border border-black/10 rounded-lg px-4 py-2"
                placeholder="Email de confirmation"
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
              <input
                className="w-full border border-black/10 rounded-lg px-4 py-2"
                placeholder="Téléphone"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
              <input
                className="w-full border border-black/10 rounded-lg px-4 py-2"
                placeholder="Société (optionnel)"
                value={contact.company}
                onChange={(e) => setContact({ ...contact, company: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={status.type === 'loading'}
              className="w-full bg-black hover:bg-[#2B2B2B] text-white py-4 rounded-lg transition duration-300 flex items-center justify-center disabled:opacity-70"
            >
              {status.type === 'loading' ? 'Envoi en cours...' : 'Valider la réservation'}
            </button>
            {status.type !== 'idle' && (
              <p
                className={`text-sm ${
                  status.type === 'success' ? 'text-green-700' : status.type === 'error' ? 'text-red-600' : 'text-black'
                }`}
              >
                {status.message}
              </p>
            )}
          </div>
        </form>

        <div className="bg-gray-50 rounded-2xl p-6 space-y-6 border border-black/5">
          <div>
            <h3 className="text-2xl font-bold text-black">Récapitulatif</h3>
            <p className="text-sm text-black/70">Arrivée 17h30 · Départ 11h30</p>
          </div>
          {selectedRoom ? (
            <div className="space-y-3 text-black">
              <div className="flex justify-between">
                <span className="font-semibold">{selectedRoom.name}</span>
                <span>{selectedRoom.price}€ / nuit</span>
              </div>
              <div className="flex justify-between text-sm text-black/80">
                <span>Dates</span>
                <span>{formatDisplayRange(startDate, endDate) || 'À définir'}</span>
              </div>
              <div className="flex justify-between text-sm text-black/80">
                <span>Voyageurs</span>
                <span>{guests}</span>
              </div>
              <div className="flex justify-between text-sm text-black/80">
                <span>Services</span>
                <span>
                  {availableExtras
                    .filter((extra) => extras[extra.id])
                    .map((extra) => extra.label)
                    .join(', ') || 'Aucun'}
                </span>
              </div>
              {total ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{total.nights} nuit(s)</span>
                    <span>{formatCurrency(total.base)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Services</span>
                    <span>{formatCurrency(total.extrasCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>{formatCurrency(total.taxes)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg">
                    <span>Total estimé</span>
                    <span className="text-primary">{formatCurrency(total.total)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-black/60 text-sm">Choisissez vos dates pour obtenir un devis.</p>
              )}
            </div>
          ) : (
            <p className="text-black">Sélectionnez une chambre pour obtenir un devis détaillé.</p>
          )}

          {activeBooking && (
            <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
              <p className="text-sm uppercase tracking-wide text-green-600 mb-1">Réservation créée</p>
              <p className="font-bold text-black">N° {activeBooking.reservationNumber}</p>
              <p className="text-sm text-black/70">
                Chambre {activeBooking.roomName} · {formatDisplayRange(activeBooking.startDate, activeBooking.endDate)}
              </p>
              <p className="text-xs text-black/60 mt-2">
                Confirmation envoyée à {contactDetails.notificationEmails.join(', ')}.
              </p>
              <button
                type="button"
                disabled={status.type === 'loading' || activeBooking.status === 'payée' || !stripeSettings.enableStripe}
                onClick={handleStripePayment}
                className="mt-3 w-full bg-primary text-black font-semibold py-3 rounded-lg hover:bg-secondary disabled:opacity-60"
              >
                {activeBooking.status === 'payée' ? 'Paiement confirmé' : 'Payer via Stripe'}
              </button>
              {!stripeSettings.enableStripe && (
                <p className="text-xs text-red-600 mt-2">Activez Stripe dans l'espace administration.</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl p-4 border border-black/5">
            <p className="text-sm text-black/70">Besoin d'aide ?</p>
            <p className="font-semibold text-black">Téléphone : {contactDetails.phone}</p>
            <p className="font-semibold text-black">Email : {contactDetails.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
