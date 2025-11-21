import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_SLIDES = [
  {
    name: 'Eva',
    slug: 'eva',
    highlight: 'Refuge romantique',
    description: "Chambre lumineuse avec balcon, idéale pour une escapade à deux au cœur de Nesle.",
    image:
      'https://images.unsplash.com/photo-1611892441796-a4839ed3fd55?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Eden',
    slug: 'eden',
    highlight: 'Ecrin végétal',
    description: 'Décoration cosy, accès direct au jardin et literie premium pour des nuits paisibles.',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Sohan',
    slug: 'sohan',
    highlight: 'Suite cheminée & spa',
    description: 'Un vaste cocon avec cheminée, baignoire spa et vue apaisante sur la campagne samarienne.',
    image:
      'https://images.unsplash.com/photo-1616594039964-4378b84e6a67?auto=format&fit=crop&w=1200&q=80'
  }
];

export default function HeroSlider({ rooms = [] }) {
  const slides = useMemo(() => {
    if (!rooms?.length) return DEFAULT_SLIDES;
    return rooms.slice(0, 3).map((room, idx) => ({
      name: room.name,
      slug: room.slug,
      highlight: room.highlight || DEFAULT_SLIDES[idx % DEFAULT_SLIDES.length].highlight,
      description: room.description,
      image: room.image
    }));
  }, [rooms]);

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6200);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="slider-shell py-16 md:py-24" id="home">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
        <div className="slider-card rounded-3xl p-8 md:p-10 text-black">
          <p className="badge bg-black text-white uppercase tracking-widest mb-4">Chambres signature</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Découvrez ChambreANesle</h1>
          <p className="text-lg mb-6">
            Trois ambiances pour sublimer votre séjour à Nesle, entre Roye et Péronne. Réservez directement pour profiter
            des meilleures conditions.
          </p>

          <div className="bg-white/80 rounded-2xl p-5 shadow-inner mb-6">
            <div className="flex items-center gap-3 mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
              <span className="inline-flex h-2 w-2 rounded-full bg-black" />
              {slides[current].highlight}
            </div>
            <h2 className="text-2xl font-bold mb-2">{slides[current].name}</h2>
            <p className="text-black/80 mb-4">{slides[current].description}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/chambres/${slides[current].slug}`}
                className="cta-button bg-black text-white px-4 py-2 rounded-full font-semibold"
              >
                Découvrir {slides[current].name}
              </Link>
              <Link
                to="/reserver"
                className="cta-button bg-white border border-black text-black px-4 py-2 rounded-full font-semibold"
              >
                Réserver maintenant
              </Link>
            </div>
          </div>

          <div className="slider-controls flex items-center gap-3">
            {slides.map((slide, idx) => (
              <button
                type="button"
                key={slide.slug}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === current ? 'w-10 bg-black' : 'w-4 bg-black/50'
                }`}
                aria-label={`Aller au slide ${slide.name}`}
              />
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-white/30 blur-3xl" aria-hidden />
          <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-white/40">
            <img
              src={slides[current].image}
              alt={slides[current].name}
              className="w-full h-[420px] object-cover transition-all duration-700"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
