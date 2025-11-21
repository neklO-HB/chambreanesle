import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
const LOGO_URL = 'https://i.postimg.cc/25L3kxTM/logo-2.webp';
import { rooms } from '../services/api';

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Contact', to: '/contact' }
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="bg-primary/90 backdrop-blur shadow-lg py-3 px-6 sticky top-0 z-50 text-black">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
          <span className="relative inline-flex items-center justify-center rounded-full p-2">
            <img src={LOGO_URL} alt="Logo ChambreANesle" className="h-10 w-auto animate-fade-in rounded-full" />
          </span>
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
          <NavLink
            to={navLinks[0].to}
            onClick={closeMenu}
            className={({ isActive }) =>
              `nav-link text-black font-semibold tracking-wide hover:text-[#2B2B2B] ${
                isActive ? 'active-nav-link' : ''
              }`
            }
          >
            {navLinks[0].label}
          </NavLink>

          <div className="relative group">
            <button type="button" className="nav-link text-black font-semibold tracking-wide">
              Nos chambres
              <i className="fas fa-chevron-down ml-2 text-xs" aria-hidden />
            </button>
            <div className="absolute left-0 mt-3 bg-white rounded-xl shadow-2xl p-4 min-w-[240px] border border-black/5 opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
              <div className="flex flex-col gap-2">
                {rooms.map((room) => (
                  <NavLink
                    key={room.slug}
                    to={`/chambres/${room.slug}`}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex justify-between items-center px-3 py-2 rounded-lg hover:bg-primary/10 text-black ${
                        isActive ? 'bg-primary/20 font-semibold' : ''
                      }`
                    }
                  >
                    <span>{room.name}</span>
                    <i className="fas fa-arrow-right text-xs" aria-hidden />
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          <NavLink
            to={navLinks[1].to}
            onClick={closeMenu}
            className={({ isActive }) =>
              `nav-link text-black font-semibold tracking-wide hover:text-[#2B2B2B] ${
                isActive ? 'active-nav-link' : ''
              }`
            }
          >
            {navLinks[1].label}
          </NavLink>

          <NavLink
            to="/reserver"
            className="cta-button bg-black text-white px-4 py-2 rounded-full font-semibold shadow-lg hover:bg-[#2B2B2B]"
          >
            Réserver
          </NavLink>
          <NavLink
            to="/espace-membre"
            className="cta-button bg-primary text-white px-4 py-2 rounded-full font-semibold shadow-lg hover:bg-secondary"
          >
            Espace membre
          </NavLink>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-4 bg-white rounded-2xl shadow-2xl p-4 animate-slide-down">
          <div className="flex flex-col space-y-3">
            <NavLink
              to={navLinks[0].to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `nav-link text-black font-semibold py-2 px-3 rounded-lg hover:text-[#2B2B2B] ${
                  isActive ? 'bg-primary/20' : ''
                }`
              }
            >
              {navLinks[0].label}
            </NavLink>

            <div className="bg-primary/10 rounded-xl p-3">
              <p className="font-semibold mb-2">Nos chambres</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rooms.map((room) => (
                  <NavLink
                    key={room.slug}
                    to={`/chambres/${room.slug}`}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `nav-link text-black font-semibold py-2 px-3 rounded-lg hover:text-[#2B2B2B] ${
                        isActive ? 'bg-primary/20' : ''
                      }`
                    }
                  >
                    {room.name}
                  </NavLink>
                ))}
              </div>
            </div>

            <NavLink
              to={navLinks[1].to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `nav-link text-black font-semibold py-2 px-3 rounded-lg hover:text-[#2B2B2B] ${
                  isActive ? 'bg-primary/20' : ''
                }`
              }
            >
              {navLinks[1].label}
            </NavLink>

            <NavLink
              to="/reserver"
              onClick={closeMenu}
              className="cta-button w-full text-center bg-black text-white px-4 py-2 rounded-full font-semibold shadow-lg hover:bg-[#2B2B2B]"
            >
              Réserver
            </NavLink>
            <NavLink
              to="/espace-membre"
              onClick={closeMenu}
              className="cta-button w-full text-center bg-primary text-white px-4 py-2 rounded-full font-semibold shadow-lg hover:bg-secondary"
            >
              Espace membre
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}
