export default function Footer() {
  return (
    <footer className="bg-primary text-black pt-16 pb-10" id="contact">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-3">ChambreANesle</h3>
            <p className="text-black mb-4">
              Maison d'hôtes premium à Nesle (80), entre Roye et Péronne. Idéal pour réserver une chambre chaleureuse dans la
              Somme.
            </p>
            <p className="text-black/70 text-sm">Réservez votre chambre d'hôtes ou suite spa au meilleur tarif.</p>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Nous trouver</h4>
            <p className="text-black mb-2">1 Avenue Foch, Nesle 80190</p>
            <div className="rounded-xl overflow-hidden shadow-lg border border-black/10">
              <iframe
                title="Localisation ChambreANesle"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2530.1874919088197!2d2.911!3d49.756!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e7e7c17d793bf7%3A0x0!2zNDnCsDQ1JzIyLjAiTiAywrA1NCcwMy45IkU!5e0!3m2!1sfr!2sfr!4v1700000000000"
                width="100%"
                height="180"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Navigation</h4>
            <ul className="space-y-3">
              <li><a href="/" className="transition duration-300">Accueil</a></li>
              <li><a href="/chambres" className="transition duration-300">Nos chambres Eva, Eden, Sohan</a></li>
              <li><a href="/reserver" className="transition duration-300">Réserver une chambre</a></li>
              <li><a href="/a-propos" className="transition duration-300">Chambre d'hôtes à Nesle</a></li>
              <li><a href="/contact" className="transition duration-300">Contact & accès</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Contact & newsletter</h4>
            <p className="text-black mb-2">chambreanesle@gmail.com</p>
            <p className="text-black mb-4">0648939733</p>
            <form className="flex">
              <input
                type="email"
                placeholder="Votre email"
                className="px-4 py-2 w-full rounded-l-lg text-black focus:outline-none border border-black/10"
              />
              <button className="bg-black hover:bg-secondary px-4 rounded-r-lg text-white">
                <i className="fas fa-paper-plane" aria-hidden />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-black pt-8 text-center text-black">
          <p>&copy; 2025 ChambreANesle. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
