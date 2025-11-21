import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRoom } from '../services/api';
import { getRoomGallery } from '../services/gallery';

export default function RoomPage() {
  const { slug } = useParams();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    getRoom(slug)
      .then(setRoom)
      .catch((err) => setError(err.message || 'Chambre introuvable.'));
    setGallery(getRoomGallery(slug));
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
        <p className="text-center text-black">Chargement de la chambre...</p>
      </div>
    );
  }

  return (
    <div className="bg-primary text-black">
      <div className="hero-bg py-16">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2 space-y-4">
            <p className="badge bg-white text-primary inline-flex">ChambreANesle</p>
            <h1 className="text-4xl font-bold">{room.name}</h1>
            <p className="text-black text-lg">{room.description}</p>
            <div className="flex items-center gap-4 text-black font-semibold">
              <span className="bg-white px-3 py-1 rounded-full">{room.price}€ / nuit</span>
              <Link
                to="/reserver"
                className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
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
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-2xl font-bold text-black mb-3">À propos de la chambre</h2>
            <p className="text-black">{room.description}</p>
          </div>
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-xl font-bold text-black mb-4">Équipements</h3>
            <div className="tag-list">
              {room.features.map((feature) => (
                <span key={feature} className="tag">
                  {feature}
                </span>
              ))}
            </div>
          </div>
          {!!gallery.length && (
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-xl font-bold text-black mb-4">Photos additionnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gallery.map((photo) => (
                  <figure key={photo.id} className="rounded-xl overflow-hidden shadow">
                    <img src={photo.src} alt={photo.caption || room.name} className="w-full h-48 object-cover" />
                    {photo.caption && <figcaption className="p-2 text-sm text-black/80">{photo.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-lg rounded-xl p-6 border">
            <h3 className="text-xl font-bold text-black mb-4">Tarifs et informations</h3>
            <ul className="space-y-2 text-black">
              <li className="flex justify-between">
                <span>Nuitée</span>
                <span className="font-semibold text-black">{room.price}€</span>
              </li>
              <li className="flex justify-between">
                <span>Petit déjeuner</span>
                <span>20€ / pers.</span>
              </li>
              <li className="flex justify-between">
                <span>Arrivée</span>
                <span>À partir de 17h30</span>
              </li>
              <li className="flex justify-between">
                <span>Départ</span>
                <span>Avant 11h30</span>
              </li>
            </ul>
            <Link
              to="/reserver"
              className="mt-4 w-full inline-flex justify-center bg-white text-black rounded-lg py-3 font-semibold border border-black transition"
            >
              Demander une réservation
            </Link>
            <p className="text-xs text-black mt-3">Paiement sécurisé, confirmation sous 24h.</p>
          </div>
          <div className="bg-white rounded-xl p-6">
            <h4 className="font-bold text-black mb-3">Une question ?</h4>
            <p className="text-black mb-3">Contactez-nous pour préparer votre arrivée.</p>
            <a className="block text-black font-semibold" href="mailto:dupuisbrian80@outlook.fr">
              dupuisbrian80@outlook.fr
            </a>
            <a className="block text-black font-semibold" href="tel:0648939733">0648939733</a>
          </div>
        </div>
      </div>
    </div>
  );
}
