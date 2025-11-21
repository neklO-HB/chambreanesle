import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">Page introuvable</h1>
      <p className="text-black mb-6">La page que vous recherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className="bg-white text-black px-4 py-2 rounded-lg font-semibold transition border border-black">
        Retour à l'accueil
      </Link>
    </div>
  );
}
