import { useEffect, useState } from 'react';
import BookingForm from '../components/BookingForm';
import RoomCard from '../components/RoomCard';
import { getRooms } from '../services/api';

const features = [
  {
    icon: 'fa-mountain',
    title: 'Cadre exceptionnel',
    description: "Nichée dans un écrin de verdure, notre chambre d'hôtes offre un cadre paisible et enchanteur."
  },
  {
    icon: 'fa-concierge-bell',
    title: 'Service personnalisé',
    description: 'Notre équipe attentionnée s\'assure que chaque détail de votre séjour soit parfait.'
  },
  {
    icon: 'fa-utensils',
    title: 'Cuisine locale',
    description: 'Dégustez des produits locaux savoureux préparés avec passion et savoir-faire.'
  }
];

const testimonials = [
  {
    name: 'Sophie & Pierre',
    location: 'Paris, France',
    quote:
      'Un endroit magique ! Le calme, la beauté des lieux et l\'accueil chaleureux ont fait de notre séjour une expérience inoubliable.'
  },
  {
    name: 'Amélie',
    location: 'Bruxelles, Belgique',
    quote:
      'Décoration soignée, literie incroyable et petit déjeuner délicieux : tout est pensé pour se détendre.'
  },
  {
    name: 'Julien & Clara',
    location: 'Lille, France',
    quote: 'Nous avons adoré la suite Sohan et sa cheminée. Idéal pour un week-end cocooning en couple !'
  }
];

export default function HomePage() {
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
    <div className="text-black">
      <section id="home" className="hero-bg py-20 md:py-28">
        <div className="container mx-auto px-6 text-center max-w-4xl content-card rounded-2xl shadow-lg">
          <span className="badge bg-white text-primary uppercase tracking-wide mb-4">Maison d'hôtes</span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Un havre de paix au cœur de la nature</h1>
          <p className="text-lg md:text-xl mb-10 text-black">
            Retrouvez l'ambiance chaleureuse de notre maison familiale à Nesle : trois chambres uniques, un jardin luxuriant et
            un accueil attentionné.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/chambres"
              className="bg-primary text-black font-bold py-3 px-8 rounded-full text-lg transition duration-300 transform hover:scale-105"
            >
              Découvrir nos chambres
            </a>
            <a
              href="/reservation"
              className="bg-white border-2 border-black hover:bg-primary hover:border-primary text-black font-bold py-3 px-8 rounded-full text-lg transition duration-300"
            >
              Réserver maintenant
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 section-surface" id="about">
        <div className="container mx-auto px-6">
          <div className="section-title">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Pourquoi choisir Chambre à Nesle ?</h2>
            <p>Un séjour authentique au milieu des arbres, avec le confort d'un hôtel boutique.</p>
            <div className="w-20 h-1 bg-primary mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature) => (
              <div key={feature.title} className="text-center feature-icon content-card rounded-xl p-6 shadow-lg">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className={`fas ${feature.icon} text-black text-3xl`} aria-hidden />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-black">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="rooms" className="py-20 section-surface">
        <div className="container mx-auto px-6">
          <div className="section-title">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Nos chambres</h2>
            <p>Trois espaces uniques conçus pour votre confort et votre détente.</p>
            <div className="w-20 h-1 bg-primary mx-auto mt-4" />
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
        </div>
      </section>

      <section className="py-20 section-surface" id="booking">
        <div className="container mx-auto px-6">
          <div className="section-title">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Réservez votre séjour</h2>
            <p>Consultez la disponibilité et réservez en ligne en toute simplicité.</p>
            <div className="w-20 h-1 bg-primary mx-auto mt-4" />
          </div>
          <BookingForm rooms={rooms} />
        </div>
      </section>

      <section className="py-20 section-surface" id="testimonials">
        <div className="container mx-auto px-6">
          <div className="section-title">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Témoignages de nos clients</h2>
            <p>Découvrez ce que nos hôtes disent de leur expérience.</p>
            <div className="w-20 h-1 bg-primary mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="testimonial-card content-card rounded-xl p-6 shadow-md flex flex-col h-full">
                <div className="text-yellow-400 flex mb-4" aria-hidden>
                  {[...Array(5)].map((_, idx) => (
                    <i key={idx} className="fas fa-star" />
                  ))}
                </div>
                <p className="text-black italic mb-6 flex-1">"{testimonial.quote}"</p>
                <div>
                  <h4 className="font-bold text-black">{testimonial.name}</h4>
                  <p className="text-black text-sm">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
