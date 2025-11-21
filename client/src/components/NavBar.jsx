import { Link } from 'react-router-dom';

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Nos chambres', href: '/#rooms' },
  { label: 'Réservation', href: '/#booking' },
  { label: 'À propos', href: '/#about' },
  { label: 'Contact', href: '/#contact' }
];

export default function NavBar() {
  return (
    <nav className="bg-white shadow-md py-4 px-6 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <div className="text-primary font-bold text-2xl mr-2">Chambre à Nesle</div>
        </Link>
        <div className="hidden md:flex space-x-8 items-center">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="nav-link text-dark hover:text-primary font-medium">
              {link.label}
            </a>
          ))}
          <a
            href="/#booking"
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition button-shadow"
          >
            Réserver
          </a>
        </div>
        <div className="md:hidden text-dark">
          <i className="fas fa-bed text-xl" aria-hidden />
        </div>
      </div>
    </nav>
  );
}
