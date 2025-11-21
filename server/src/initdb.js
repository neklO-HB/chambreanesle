import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'chambreanesle.db');

fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

const rooms = [
  {
    name: 'Eva',
    slug: 'eva',
    price: 120,
    description: "Une chambre romantique avec vue sur le jardin, décorée avec raffinement.",
    features: ['Double', 'Balcon', 'Jacuzzi'],
    image:
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
    highlight: 'Chambre romantique avec balcon'
  },
  {
    name: 'Sohan',
    slug: 'sohan',
    price: 140,
    description: 'Une suite spacieuse avec cheminée et baignoire spa pour un séjour luxueux.',
    features: ['Suite', 'Cheminée', 'Vue panoramique'],
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    highlight: 'Suite spacieuse avec cheminée'
  },
  {
    name: 'Eden',
    slug: 'eden',
    price: 110,
    description: 'Une chambre cosy avec décoration champêtre et accès direct au jardin.',
    features: ['Simple ou double', 'Jardin privé', 'Petit déjeuner inclus'],
    image:
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    highlight: 'Chambre cosy avec jardin privé'
  }
];

const bookings = [
  {
    roomSlug: 'eva',
    startDate: '2024-07-15',
    endDate: '2024-07-18',
    guests: 2,
    extras: ['Petit déjeuner']
  },
  {
    roomSlug: 'sohan',
    startDate: '2024-07-20',
    endDate: '2024-07-23',
    guests: 2,
    extras: ['Petit déjeuner', 'Accès spa']
  },
  {
    roomSlug: 'eden',
    startDate: '2024-08-05',
    endDate: '2024-08-08',
    guests: 3,
    extras: []
  }
];

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS bookings');
  db.run('DROP TABLE IF EXISTS rooms');

  db.run(
    `CREATE TABLE rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      description TEXT NOT NULL,
      features TEXT NOT NULL,
      image TEXT NOT NULL,
      highlight TEXT
    )`
  );

  db.run(
    `CREATE TABLE bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      guests INTEGER NOT NULL,
      extras TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(room_id) REFERENCES rooms(id)
    )`
  );

  const insertRoom = db.prepare(
    'INSERT INTO rooms (name, slug, price, description, features, image, highlight) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  rooms.forEach((room) => {
    insertRoom.run(
      room.name,
      room.slug,
      room.price,
      room.description,
      JSON.stringify(room.features),
      room.image,
      room.highlight
    );
  });

  insertRoom.finalize((err) => {
    if (err) {
      console.error('Erreur lors de la création des chambres', err);
      return;
    }

    db.all('SELECT id, slug FROM rooms', (error, rows) => {
      if (error) {
        console.error('Erreur lors de la récupération des chambres', error);
        return;
      }

      const roomIdMap = rows.reduce((acc, row) => {
        acc[row.slug] = row.id;
        return acc;
      }, {});

      const insertBooking = db.prepare(
        'INSERT INTO bookings (room_id, start_date, end_date, guests, extras) VALUES (?, ?, ?, ?, ?)'
      );

      bookings.forEach((booking) => {
        const roomId = roomIdMap[booking.roomSlug];
        if (!roomId) return;

        insertBooking.run(
          roomId,
          booking.startDate,
          booking.endDate,
          booking.guests,
          JSON.stringify(booking.extras)
        );
      });

      insertBooking.finalize((bookingErr) => {
        if (bookingErr) {
          console.error('Erreur lors de la création des réservations', bookingErr);
        }
        db.close(() => {
          console.log(`Base de données initialisée dans ${dbPath}`);
        });
      });
    });
  });
});
