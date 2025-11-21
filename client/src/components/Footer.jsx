export default function Footer() {
  return (
    <footer className="bg-dark text-white pt-16 pb-10" id="contact">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-6">Chambre à Nesle</h3>
            <p className="text-gray-400 mb-6">
              Une expérience authentique au cœur de la nature, où le confort rencontre l'élégance.
            </p>
            <div className="flex space-x-4">
              {['facebook-f', 'instagram', 'pinterest-p'].map((icon) => (
                <a key={icon} href="#" className="text-gray-400 hover:text-white transition duration-300">
                  <i className={`fab fa-${icon}`} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Liens rapides</h4>
            <ul className="space-y-3">
              <li><a href="/#" className="transition duration-300">Accueil</a></li>
              <li><a href="/#rooms" className="transition duration-300">Nos chambres</a></li>
              <li><a href="/#booking" className="transition duration-300">Réservation</a></li>
              <li><a href="/#about" className="transition duration-300">À propos</a></li>
              <li><a href="/#contact" className="transition duration-300">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Nos chambres</h4>
            <ul className="space-y-3">
              <li><a href="/chambres/eva" className="transition duration-300">Chambre Eva</a></li>
              <li><a href="/chambres/sohan" className="transition duration-300">Suite Sohan</a></li>
              <li><a href="/chambres/eden" className="transition duration-300">Chambre Eden</a></li>
              <li><a href="/#booking" className="transition duration-300">Tarifs & Disponibilités</a></li>
              <li><a href="/#booking" className="transition duration-300">Offres spéciales</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Newsletter</h4>
            <p className="text-gray-400 mb-4">Inscrivez-vous pour recevoir nos offres exclusives</p>
            <form className="flex">
              <input type="email" placeholder="Votre email" className="px-4 py-2 w-full rounded-l-lg text-dark focus:outline-none" />
              <button className="bg-primary hover:bg-secondary px-4 rounded-r-lg">
                <i className="fas fa-paper-plane" aria-hidden />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
          <p>&copy; 2024 Chambre à Nesle. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
