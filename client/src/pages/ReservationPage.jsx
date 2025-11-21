import { useEffect, useState } from 'react';
import BookingForm from '../components/BookingForm';
import { getRooms } from '../services/api';

export default function ReservationPage() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    getRooms().then(setRooms).catch(() => setRooms([]));
  }, []);

  return (
    <div className="section-surface min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-5xl space-y-8">
        <div className="section-title">
          <h1 className="text-4xl font-bold text-black mb-4">Réserver votre séjour</h1>
          <p>Choisissez vos dates, vos envies et laissez-nous préparer votre arrivée.</p>
          <div className="w-20 h-1 bg-white mx-auto mt-4" />
        </div>
        <BookingForm rooms={rooms} />
      </div>
    </div>
  );
}
