import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'chambreanesle.db');

fs.mkdirSync(dataDir, { recursive: true });

const app = express();
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur lors de l\'ouverture de la base de données.', err);
    process.exit(1);
  }
});
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');

db.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'rooms'", (err, row) => {
  if (err) {
    console.error('Erreur lors de la vérification de la base de données.', err);
    return;
  }

  if (!row) {
    console.warn('Base de données vide détectée. Exécutez "npm run initdb" pour initialiser les données.');
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(clientDistPath));

const buildDbErrorMessage = (err, defaultMessage) => {
  if (err?.message?.includes('no such table')) {
    return 'Base de données non initialisée. Exécutez "npm run initdb" pour préparer les tables.';
  }
  return defaultMessage;
};

const mapRoom = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  price: row.price,
  description: row.description,
  features: JSON.parse(row.features || '[]'),
  image: row.image,
  highlight: row.highlight || ''
});

app.get('/api/rooms', (req, res) => {
  db.all('SELECT * FROM rooms ORDER BY price DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: buildDbErrorMessage(err, 'Impossible de récupérer les chambres') });
    }
    res.json(rows.map(mapRoom));
  });
});

app.get('/api/rooms/:slug', (req, res) => {
  const { slug } = req.params;
  db.get('SELECT * FROM rooms WHERE slug = ?', [slug], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: buildDbErrorMessage(err, 'Impossible de récupérer la chambre') });
    }
    if (!row) {
      return res.status(404).json({ error: 'Chambre introuvable' });
    }
    res.json(mapRoom(row));
  });
});

app.get('/api/bookings', (req, res) => {
  const query = `
    SELECT bookings.*, rooms.name as roomName, rooms.slug as roomSlug
    FROM bookings
    JOIN rooms ON rooms.id = bookings.room_id
    ORDER BY date(start_date) ASC
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: buildDbErrorMessage(err, 'Impossible de récupérer les réservations') });
    }

    const bookings = rows.map((row) => ({
      id: row.id,
      roomId: row.room_id,
      roomName: row.roomName,
      roomSlug: row.roomSlug,
      startDate: row.start_date,
      endDate: row.end_date,
      guests: row.guests,
      extras: JSON.parse(row.extras || '[]'),
      createdAt: row.created_at
    }));

    res.json(bookings);
  });
});

app.post('/api/bookings', (req, res) => {
  const { roomSlug, startDate, endDate, guests = 1, extras = [] } = req.body;

  if (!roomSlug || !startDate || !endDate) {
    return res.status(400).json({ error: 'Les champs roomSlug, startDate et endDate sont obligatoires.' });
  }

  db.get('SELECT id FROM rooms WHERE slug = ?', [roomSlug], (roomErr, room) => {
    if (roomErr) {
      console.error(roomErr);
      return res.status(500).json({ error: buildDbErrorMessage(roomErr, 'Erreur lors de la vérification de la chambre') });
    }

    if (!room) {
      return res.status(404).json({ error: 'Chambre introuvable' });
    }

    const insertQuery =
      'INSERT INTO bookings (room_id, start_date, end_date, guests, extras) VALUES (?, ?, ?, ?, ?)';

    db.run(insertQuery, [room.id, startDate, endDate, guests, JSON.stringify(extras)], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: buildDbErrorMessage(err, 'Impossible de créer la réservation') });
      }

      res.status(201).json({
        id: this.lastID,
        roomId: room.id,
        roomSlug,
        startDate,
        endDate,
        guests,
        extras
      });
    });
  });
});

app.get('/calendars/:slug.ical', (req, res) => {
  const { slug } = req.params;
  const query = `
    SELECT bookings.*, rooms.name as roomName, rooms.slug as roomSlug
    FROM bookings
    JOIN rooms ON rooms.id = bookings.room_id
    WHERE rooms.slug = ?
    ORDER BY date(start_date) ASC
  `;

  db.all(query, [slug], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erreur lors de la génération du calendrier.');
    }

    const formatDate = (date) => `${date.replaceAll('-', '')}T120000Z`;
    const body = rows
      .map(
        (booking) =>
          `BEGIN:VEVENT\nUID:${booking.id}@chambreanesle\nSUMMARY:${booking.roomName}\nDTSTART:${formatDate(
            booking.start_date
          )}\nDTEND:${formatDate(booking.end_date)}\nEND:VEVENT`
      )
      .join('\n');

    const payload = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ChambreANesle//Calendrier//FR\n${body}\nEND:VCALENDAR`;
    res.header('Content-Type', 'text/calendar; charset=utf-8');
    res.send(payload);
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint introuvable' });
  }

  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API prête sur http://localhost:${PORT}`);
});
