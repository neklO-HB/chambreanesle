import { useEffect, useState } from 'react';
import RoomCard from '../components/RoomCard';
import { getRooms } from '../services/api';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getRooms()
      .then(setRooms)
      .catch((err) => setError(err.message || 'Impossible de charger les chambres.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="section-surface min-h-screen py-16">
      <div className="container mx-auto px-6">
        <div className="section-title">
          <h2 className="text-4xl font-bold text-black mb-4">Nos chambres</h2>
          <p>Toutes nos suites sont prêtes à vous accueillir pour une parenthèse calme et lumineuse.</p>
          <div className="w-20 h-1 bg-white mx-auto mt-4" />
        </div>
        {loading && <p className="text-center text-black">Chargement des chambres...</p>}
        {error && <p className="text-center text-red-700">{error}</p>}
        {!loading && !error && (
          <div className="card-grid">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
        <div className="text-center mt-10">
          <a
            className="cta-button inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-semibold"
            href="/reserver"
          >
            Réserver l'une de nos chambres
            <i className="fas fa-arrow-right" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}
