import { useEffect, useMemo, useState } from 'react';
import { createBooking } from '../services/api';

const defaultExtras = {
  breakfast: false,
  spa: false
};

export default function BookingForm({ rooms }) {
  const [roomSlug, setRoomSlug] = useState(rooms[0]?.slug || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [extras, setExtras] = useState(defaultExtras);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  useEffect(() => {
    if (!roomSlug && rooms[0]?.slug) {
      setRoomSlug(rooms[0].slug);
    }
  }, [rooms, roomSlug]);

  const selectedRoom = useMemo(() => rooms.find((room) => room.slug === roomSlug), [rooms, roomSlug]);

  const extrasList = [
    { key: 'breakfast', label: 'Petit déjeuner (20€/personne)' },
    { key: 'spa', label: 'Accès spa (35€/personne)' }
  ];

  const extrasCount = Object.values(extras).filter(Boolean).length;

  const total = useMemo(() => {
    if (!selectedRoom || !startDate || !endDate) return null;
    const nights = Math.max(0, (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const base = nights * selectedRoom.price;
    const extrasCost = extrasCount * 20 * guests;
    const taxes = base * 0.05;
    return {
      nights,
      base,
      extrasCost,
      taxes,
      total: base + extrasCost + taxes
    };
  }, [selectedRoom, startDate, endDate, extrasCount, guests]);

  const toggleExtra = (key) => {
    setExtras((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: '' });

    try {
      const selectedExtras = extrasList.filter((extra) => extras[extra.key]).map((extra) => extra.label);
      await createBooking({ roomSlug, startDate, endDate, guests, extras: selectedExtras });
      setStatus({ type: 'success', message: 'Réservation enregistrée ! Nous vous recontactons rapidement.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Impossible de créer la réservation.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8" id="booking">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <h3 className="text-2xl font-bold text-dark mb-4">Sélectionnez une chambre</h3>
            <div className="space-y-3">
              {rooms.map((room) => (
                <label
                  key={room.slug}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer hover:border-primary ${
                    roomSlug === room.slug ? 'border-primary bg-gray-50' : 'border-gray-200'
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
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-dark">{room.name}</span>
                      <span className="text-primary font-medium">{room.price}€/nuit</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{room.highlight || room.description}</p>
                  </div>
                </label>
              ))}
              {!rooms.length && <p className="text-gray-600">Les chambres sont en cours de chargement...</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-dark">Informations de réservation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Arrivée</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Départ</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Nombre de personnes</label>
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
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Services supplémentaires</label>
              <div className="space-y-2">
                {extrasList.map((extra) => (
                  <label key={extra.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={extras[extra.key]}
                      onChange={() => toggleExtra(extra.key)}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-gray-700">{extra.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={status.type === 'loading' || !roomSlug}
              className="w-full bg-primary hover:bg-secondary text-white py-3 rounded-lg transition duration-300 flex items-center justify-center disabled:opacity-70"
            >
              {status.type === 'loading' ? 'Envoi en cours...' : 'Valider la réservation'}
            </button>
            {status.type !== 'idle' && (
              <p
                className={`mt-3 text-sm ${
                  status.type === 'success' ? 'text-green-700' : status.type === 'error' ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {status.message}
              </p>
            )}
          </div>
        </form>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-dark">Récapitulatif</h3>
          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            {selectedRoom ? (
              <>
                <div className="flex justify-between">
                  <span>{selectedRoom.name}</span>
                  <span className="font-semibold text-primary">{selectedRoom.price}€ / nuit</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Dates</span>
                  <span>
                    {startDate || 'Arrivée'} → {endDate || 'Départ'}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Voyageurs</span>
                  <span>{guests}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Services</span>
                  <span>{extrasCount || 'Aucun'}</span>
                </div>
                {total && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>{total.nights} nuit(s)</span>
                      <span>{total.base.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Services</span>
                      <span>{total.extrasCost.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxes</span>
                      <span>{total.taxes.toFixed(2)}€</span>
                    </div>
                    <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg">
                      <span>Total estimé</span>
                      <span className="text-primary">{total.total.toFixed(2)}€</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-gray-600">Sélectionnez une chambre pour obtenir un devis détaillé.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
