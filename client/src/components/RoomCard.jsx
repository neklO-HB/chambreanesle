import { Link } from 'react-router-dom';

export default function RoomCard({ room }) {
  return (
    <div className="room-card bg-white rounded-xl overflow-hidden shadow-lg">
      <div className="h-60 overflow-hidden">
        <img src={room.image} alt={room.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
      </div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-2xl font-bold text-dark">{room.name}</h3>
          <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">À partir de {room.price}€/nuit</span>
        </div>
        <p className="text-gray-600">{room.description}</p>
        <div className="tag-list">
          {room.features?.map((feature) => (
            <span key={feature} className="tag">
              {feature}
            </span>
          ))}
        </div>
        <Link
          to={`/chambres/${room.slug}`}
          className="inline-flex w-full justify-center bg-primary hover:bg-secondary text-white py-3 rounded-lg transition duration-300"
        >
          Voir les détails
        </Link>
      </div>
    </div>
  );
}
