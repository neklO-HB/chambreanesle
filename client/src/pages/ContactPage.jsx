const contacts = [
  { label: 'Téléphone', value: '0648939733', href: 'tel:0648939733' },
  { label: 'Email', value: 'dupuisbrian80@outlook.fr', href: 'mailto:dupuisbrian80@outlook.fr' },
  { label: 'Adresse', value: 'Nesle, 80190, Hauts-de-France' }
];

export default function ContactPage() {
  return (
    <div className="section-surface min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-4xl space-y-10">
        <div className="section-title">
          <h1 className="text-4xl font-bold text-black mb-4">Contact</h1>
          <p>Une question, une demande particulière ou l\'envie de réserver directement ? Nous sommes disponibles.</p>
          <div className="w-20 h-1 bg-white mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contacts.map((item) => (
            <div key={item.label} className="content-card rounded-xl p-6 shadow-md">
              <p className="text-sm uppercase tracking-wide mb-2">{item.label}</p>
              {item.href ? (
                <a className="font-semibold text-black" href={item.href}>
                  {item.value}
                </a>
              ) : (
                <p className="font-semibold text-black">{item.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="content-card rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Comment nous rejoindre</h2>
          <ul className="list-disc pl-6 space-y-2 text-black">
            <li>Parking gratuit devant la maison.</li>
            <li>Gare de Nesle à moins de 10 minutes en voiture.</li>
            <li>Arrivée autonome possible sur demande.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
