const highlights = [
  {
    title: 'Une maison entourée de verdure',
    description: 'Profitez d\'un jardin arboré, d\'une terrasse ombragée et d\'un calme absolu à seulement quelques minutes de Nesle.'
  },
  {
    title: 'Accueil attentionné',
    description: 'Petit-déjeuner local, conseils personnalisés et aide pour organiser vos visites ou vos réservations.'
  },
  {
    title: 'Confort contemporain',
    description: 'Literie premium, espaces lumineux, salle de bain privative et petites attentions pour chaque chambre.'
  }
];

const commitments = [
  'Produits frais et locaux pour la table du matin',
  'Respect de l\'environnement et des ressources',
  'Flexibilité pour les arrivées tardives et demandes spéciales',
  'Recommandations sur mesure pour découvrir la région'
];

export default function AboutPage() {
  return (
    <div className="section-surface min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-5xl space-y-12">
        <div className="section-title">
          <h1 className="text-4xl font-bold text-black mb-4">À propos de ChambreANesle</h1>
          <p>
            Une maison familiale repensée pour accueillir voyageurs, couples et amis en quête de sérénité au cœur de la Somme,
            à Nesle.
          </p>
          <div className="w-20 h-1 bg-white mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((item) => (
            <div key={item.title} className="content-card rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-black">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="content-card rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Nos engagements</h2>
          <ul className="list-disc pl-6 space-y-2 text-black">
            {commitments.map((commitment) => (
              <li key={commitment}>{commitment}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
