const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guestName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      room TEXT NOT NULL,
      checkIn DATE NOT NULL,
      checkOut DATE NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'Nouveau',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  db.get('SELECT id FROM users WHERE username = ?', ['Webmaster'], (err, row) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'utilisateur par défaut', err);
      return;
    }
    if (!row) {
      const hashedPassword = bcrypt.hashSync('Didi0509@', 10);
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['Webmaster', hashedPassword], (insertErr) => {
        if (insertErr) {
          console.error('Erreur lors de la création de l\'utilisateur par défaut', insertErr);
        } else {
          console.log('Utilisateur par défaut "Webmaster" créé.');
        }
      });
    }
  });
});

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'chambre-a-nesle-secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

const rooms = [
  {
    name: 'Eva',
    size: '25 m²',
    vibe: 'Lumineuse & artistique',
    features: ['Lit queen', 'Salle de bain privée', 'Vue sur le jardin'],
  },
  {
    name: 'Sohan',
    size: '22 m²',
    vibe: 'Cosy & minimaliste',
    features: ['Lit double', 'Coin bureau', 'Douche à l\'italienne'],
  },
  {
    name: 'Eden',
    size: '28 m²',
    vibe: 'Suite signature',
    features: ['Lit king', 'Baie vitrée', 'Canapé lounge'],
  },
];

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Veuillez vous connecter.' };
    return res.redirect('/admin/login');
  }
  next();
};

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    rooms,
    address: '1 Avenue Foch, 80190 Nesle',
  });
});

app.post('/reserve', (req, res) => {
  const { guestName, email, phone, room, checkIn, checkOut, notes } = req.body;
  const allowedRooms = rooms.map((r) => r.name);

  if (!guestName || !email || !phone || !room || !checkIn || !checkOut) {
    req.session.flash = { type: 'error', message: 'Merci de remplir tous les champs obligatoires.' };
    return res.redirect('/#reservation');
  }

  if (!allowedRooms.includes(room)) {
    req.session.flash = { type: 'error', message: 'Chambre invalide.' };
    return res.redirect('/#reservation');
  }

  db.run(
    `INSERT INTO reservations (guestName, email, phone, room, checkIn, checkOut, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ,
    [guestName.trim(), email.trim(), phone.trim(), room, checkIn, checkOut, notes || ''],
    (err) => {
      if (err) {
        console.error(err);
        req.session.flash = { type: 'error', message: 'Une erreur est survenue. Merci de réessayer.' };
      } else {
        req.session.flash = { type: 'success', message: 'Demande envoyée ! Nous revenons vers vous rapidement.' };
      }
      res.redirect('/#reservation');
    }
  );
});

app.get('/admin/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('login');
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error(err);
      req.session.flash = { type: 'error', message: 'Erreur serveur.' };
      return res.redirect('/admin/login');
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      req.session.flash = { type: 'error', message: 'Identifiants invalides.' };
      return res.redirect('/admin/login');
    }

    req.session.user = { id: user.id, username: user.username };
    res.redirect('/admin');
  });
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

app.get('/admin', requireAuth, (req, res) => {
  db.all('SELECT * FROM reservations ORDER BY createdAt DESC', (err, reservations) => {
    if (err) {
      console.error(err);
      req.session.flash = { type: 'error', message: 'Impossible de charger les réservations.' };
      return res.redirect('/');
    }
    res.render('admin', { reservations });
  });
});

app.post('/admin/reservations/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const allowed = ['Nouveau', 'Confirmé', 'Annulé'];
  if (!allowed.includes(status)) {
    req.session.flash = { type: 'error', message: 'Statut non valide.' };
    return res.redirect('/admin');
  }

  db.run('UPDATE reservations SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      console.error(err);
      req.session.flash = { type: 'error', message: 'Mise à jour impossible.' };
    } else {
      req.session.flash = { type: 'success', message: 'Statut mis à jour.' };
    }
    res.redirect('/admin');
  });
});

app.use((req, res) => {
  res.status(404).render('index', {
    rooms,
    address: '1 Avenue Foch, 80190 Nesle',
  });
});

app.listen(PORT, () => {
  console.log(`Chambre À Nesle en ligne sur le port ${PORT}`);
});
