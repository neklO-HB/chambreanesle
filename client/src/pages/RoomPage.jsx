import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRoom } from '../services/api';

export default function RoomPage() {
  const { slug } = useParams();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getRoom(slug)
      .then(setRoom)
      .catch((err) => setError(err.message || 'Chambre introuvable.'));
  }, [slug]);

  if (error) {
    return (
      <div className="container mx-auto px-6 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link className="text-primary font-semibold" to="/">
            Retourner à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container mx-auto px-6 py-16">
        <p className="text-center text-gray-600">Chargement de la chambre...</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="hero-bg py-16">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2 space-y-4">
            <p className="badge bg-white text-primary inline-flex">Chambre à Nesle</p>
            <h1 className="text-4xl font-bold">{room.name}</h1>
            <p className="text-white/90 text-lg">{room.description}</p>
            <div className="flex items-center gap-4 text-white font-semibold">
              <span className="bg-white/20 px-3 py-1 rounded-full">{room.price}€ / nuit</span>
              <Link
                to="/#booking"
                className="bg-white text-primary px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Réserver cette chambre
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <img src={room.image} alt={room.name} className="rounded-xl shadow-xl w-full object-cover" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-dark mb-3">À propos de la chambre</h2>
            <p className="text-gray-600">{room.description}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-dark mb-4">Équipements</h3>
            <div className="tag-list">
              {room.features.map((feature) => (
                <span key={feature} className="tag">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-lg rounded-xl p-6 border">
            <h3 className="text-xl font-bold text-dark mb-4">Tarifs et informations</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex justify-between">
                <span>Nuitée</span>
                <span className="font-semibold text-primary">{room.price}€</span>
              </li>
              <li className="flex justify-between">
                <span>Petit déjeuner</span>
                <span>20€ / pers.</span>
              </li>
              <li className="flex justify-between">
                <span>Arrivée</span>
                <span>15h00 - 21h00</span>
              </li>
              <li className="flex justify-between">
                <span>Départ</span>
                <span>Avant 11h00</span>
              </li>
            </ul>
            <Link
              to="/#booking"
              className="mt-4 w-full inline-flex justify-center bg-primary text-white rounded-lg py-3 font-semibold hover:bg-secondary transition"
            >
              Demander une réservation
            </Link>
            <p className="text-xs text-gray-500 mt-3">Paiement sécurisé, confirmation sous 24h.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-bold text-dark mb-3">Une question ?</h4>
            <p className="text-gray-600 mb-3">Contactez-nous pour préparer votre arrivée.</p>
            <a className="block text-primary font-semibold" href="mailto:contact@chambre-nesle.fr">
              contact@chambre-nesle.fr
            </a>
            <a className="block text-primary font-semibold" href="tel:+33123456789">
              +33 1 23 45 67 89
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
