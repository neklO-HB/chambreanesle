import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import logo from '../assets/logo.svg';

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Nos chambres', to: '/chambres' },
  { label: 'Réservation', to: '/reservation' },
  { label: 'À propos', to: '/a-propos' },
  { label: 'Contact', to: '/contact' },
  { label: 'Espace membre', to: '/admin' }
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-primary/90 backdrop-blur shadow-lg py-3 px-6 sticky top-0 z-50 text-black">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
          <span className="relative inline-flex items-center justify-center rounded-full bg-white/80 p-2 shadow-inner">
            <img src={logo} alt="Logo ChambreANesle" className="h-10 w-auto animate-fade-in" />
          </span>
          <div className="hidden sm:block leading-tight">
            <p className="text-xs uppercase tracking-[0.25em] font-semibold">Maison d'hôtes</p>
            <p className="text-lg font-bold">ChambreANesle</p>
          </div>
        </Link>

        <button
          type="button"
          className="md:hidden text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black rounded-full"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Ouvrir le menu"
        >
          <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'} text-2xl`} aria-hidden />
        </button>

        <div className="hidden md:flex space-x-6 items-center">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `nav-link text-black font-semibold tracking-wide ${isActive ? 'active-nav-link' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/reserver"
            className="cta-button bg-black text-white px-4 py-2 rounded-full font-semibold shadow-lg"
          >
            Réserver
          </NavLink>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-4 bg-white rounded-2xl shadow-2xl p-4 animate-slide-down">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link text-black font-semibold py-2 px-3 rounded-lg ${isActive ? 'bg-primary/20' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/reserver"
              onClick={closeMenu}
              className="cta-button w-full text-center bg-black text-white px-4 py-2 rounded-full font-semibold shadow-lg"
            >
              Réserver
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}
