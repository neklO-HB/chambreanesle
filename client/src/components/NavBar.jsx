import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/logo.svg';

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Nos chambres', to: '/chambres' },
  { label: 'Réservation', to: '/reservation' },
  { label: 'À propos', to: '/a-propos' },
  { label: 'Contact', to: '/contact' }
];

export default function NavBar() {
  return (
    <nav className="bg-primary shadow-md py-4 px-6 sticky top-0 z-50 text-black">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Logo Chambre à Nesle" className="h-12 w-auto" />
        </Link>
        <div className="hidden md:flex space-x-8 items-center">
          {navLinks.map((link) => (
            <NavLink key={link.label} to={link.to} className="nav-link text-black font-medium hover:text-black">
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/reservation" className="bg-white text-black px-4 py-2 rounded-lg font-semibold transition">
            Réserver
          </NavLink>
        </div>
        <div className="md:hidden text-black">
          <i className="fas fa-bed text-xl" aria-hidden />
        </div>
      </div>
    </nav>
  );
}
