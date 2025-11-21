export const rooms = [
  {
    id: 1,
    name: 'Eva',
    slug: 'eva',
    price: 120,
    description: "Une chambre romantique avec vue sur le jardin, décorée avec raffinement.",
    features: ['Double', 'Balcon', 'Jacuzzi'],
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
    highlight: 'Chambre romantique avec balcon'
  },
  {
    id: 2,
    name: 'Sohan',
    slug: 'sohan',
    price: 140,
    description: 'Une suite spacieuse avec cheminée et baignoire spa pour un séjour luxueux.',
    features: ['Suite', 'Cheminée', 'Vue panoramique'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    highlight: 'Suite spacieuse avec cheminée'
  },
  {
    id: 3,
    name: 'Eden',
    slug: 'eden',
    price: 110,
    description: 'Une chambre cosy avec décoration champêtre et accès direct au jardin.',
    features: ['Simple ou double', 'Jardin privé', 'Petit déjeuner inclus'],
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    highlight: 'Chambre cosy avec jardin privé'
  }
];

export function findRoom(slug) {
  return rooms.find((room) => room.slug === slug);
}
