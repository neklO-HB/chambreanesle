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
    console.error("Erreur lors de l'ouverture de la base de données.", err);
    process.exit(1);
  }
});

const viewsPath = path.join(__dirname, 'views');
const publicPath = path.join(__dirname, '..', 'public');

app.set('views', viewsPath);
app.set('view engine', 'ejs');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath));

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

const mapBooking = (row) => ({
  id: row.id,
  roomId: row.room_id,
  roomName: row.roomName ?? row.name,
  roomSlug: row.roomSlug ?? row.slug,
  startDate: row.start_date,
  endDate: row.end_date,
  guests: row.guests,
  extras: JSON.parse(row.extras || '[]'),
  createdAt: row.created_at
});

const queryAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const queryGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const runStatement = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });

const formatPrice = (value) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
};

const renderError = (res, error, status = 500) => {
  res.status(status).render('error', { title: 'Oups...', message: error });
};

const fetchRooms = async () => {
  const rows = await queryAll('SELECT * FROM rooms ORDER BY price DESC');
  return rows.map(mapRoom);
};

const fetchRoomBySlug = async (slug) => {
  const row = await queryGet('SELECT * FROM rooms WHERE slug = ?', [slug]);
  return row ? mapRoom(row) : null;
};

const fetchBookingsWithRooms = async () => {
  const rows = await queryAll(
    `SELECT bookings.*, rooms.name, rooms.slug
     FROM bookings
     JOIN rooms ON rooms.id = bookings.room_id
     ORDER BY date(start_date) ASC`
  );
  return rows.map(mapBooking);
};

app.get('/', async (_req, res) => {
  try {
    const rooms = await fetchRooms();
    res.render('home', { title: 'Maison d’hôtes près d’Anesle', rooms, formatPrice });
  } catch (error) {
    console.error(error);
    renderError(res, buildDbErrorMessage(error, 'Impossible de charger les chambres.'));
  }
});

app.get('/chambres', async (_req, res) => {
  try {
    const rooms = await fetchRooms();
    res.render('rooms', { title: 'Chambres & suites', rooms, formatPrice });
  } catch (error) {
    console.error(error);
    renderError(res, buildDbErrorMessage(error, 'Impossible de charger les chambres.'));
  }
});

app.get('/chambres/:slug', async (req, res) => {
  try {
    const room = await fetchRoomBySlug(req.params.slug);
    if (!room) {
      return renderError(res, 'Chambre introuvable', 404);
    }

    const bookings = await queryAll(
      `SELECT bookings.* FROM bookings
       JOIN rooms ON rooms.id = bookings.room_id
       WHERE rooms.slug = ?
       ORDER BY date(start_date) ASC`,
      [req.params.slug]
    );

    res.render('room', {
      title: room.name,
      room,
      formatPrice,
      formatDate,
      bookings: bookings.map(mapBooking)
    });
  } catch (error) {
    console.error(error);
    renderError(res, buildDbErrorMessage(error, 'Impossible de charger la chambre.'));
  }
});

app.get('/reservation', async (req, res) => {
  try {
    const rooms = await fetchRooms();
    const selectedSlug = req.query.roomSlug;
    res.render('reservation', {
      title: 'Réserver',
      rooms,
      formatPrice,
      errors: [],
      form: { roomSlug: selectedSlug ?? rooms[0]?.slug ?? '', startDate: '', endDate: '', guests: 2, extras: [] }
    });
  } catch (error) {
    console.error(error);
    renderError(res, buildDbErrorMessage(error, 'Impossible de charger le formulaire de réservation.'));
  }
});

app.post('/reservation', async (req, res) => {
  const { roomSlug, startDate, endDate, guests, extras = [] } = req.body;
  const normalizedExtras = Array.isArray(extras) ? extras : [extras].filter(Boolean);
  const errors = [];

  try {
    const rooms = await fetchRooms();
    const room = rooms.find((item) => item.slug === roomSlug);

    if (!roomSlug || !startDate || !endDate) {
      errors.push('Merci de renseigner la chambre, la date d’arrivée et la date de départ.');
    }

    if (!room) {
      errors.push('La chambre sélectionnée est introuvable.');
    }

    const guestsNumber = Number.parseInt(guests || '1', 10);
    if (!Number.isFinite(guestsNumber) || guestsNumber < 1) {
      errors.push('Le nombre de voyageurs doit être au minimum de 1 personne.');
    }

    if (errors.length > 0) {
      return res.status(400).render('reservation', {
        title: 'Réserver',
        rooms,
        formatPrice,
        errors,
        form: { roomSlug, startDate, endDate, guests: guestsNumber || 1, extras: normalizedExtras }
      });
    }

    const insertQuery =
      'INSERT INTO bookings (room_id, start_date, end_date, guests, extras) VALUES (?, ?, ?, ?, ?)';

    const result = await runStatement(insertQuery, [
      room.id,
      startDate,
      endDate,
      guestsNumber,
      JSON.stringify(normalizedExtras)
    ]);

    res.status(201).render('reservation-success', {
      title: 'Réservation confirmée',
      booking: {
        id: result.lastID,
        room,
        startDate,
        endDate,
        guests: guestsNumber,
        extras: normalizedExtras
      },
      formatDate,
      formatPrice
    });
  } catch (error) {
    console.error(error);
    renderError(res, buildDbErrorMessage(error, "Impossible d'enregistrer la réservation."));
  }
});

app.get('/a-propos', (_req, res) => {
  res.render('about', { title: 'À propos de la maison' });
});

app.get('/contact', (_req, res) => {
  res.render('contact', { title: 'Contact' });
});

app.get('/espace-membre', async (_req, res) => {
  try {
    const bookings = await fetchBookingsWithRooms();
    res.render('admin', { title: 'Espace membre', bookings, formatDate, formatPrice });
  } catch (error) {
    console.error(error);
    renderError(res, buildDbErrorMessage(error, "Impossible d'accéder à l'espace membre."));
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint introuvable' });
  }
  return renderError(res, 'Page introuvable', 404);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Site prêt sur http://localhost:${PORT}`);
});
