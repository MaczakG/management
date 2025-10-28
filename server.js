// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MongoClient } = require('mongodb');

const app = express();

/* ---------- Middleware ---------- */
app.use(helmet({
  contentSecurityPolicy: false, // ha statikusot is szolgálsz ki, testre szabható
}));
app.use(express.json());

// CORS – ha tudod, szűkítsd a megengedett origin(eke)t
app.use(cors({
  origin: '*',  // pl.: ['https://példa.hu'] – ha van domain
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Alap rate limit (finomhangold szükség szerint)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 perc
  max: 300,                // 300 kérés/perc/IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

/* ---------- MongoDB ---------- */
const MONGO_URI = process.env.MONGO_URI; // .env-ből
if (!MONGO_URI) {
  console.error('Hiányzik a MONGO_URI környezeti változó!');
  process.exit(1);
}

const client = new MongoClient(MONGO_URI, {
  // hasznos opciók (node-mongodb-native 4.x/5.x)
  maxPoolSize: 10,
});

let db, partnersCol;

async function initMongo() {
  try {
    await client.connect();
    console.log('MongoDB connected!');
    db = client.db(process.env.MONGO_DB || 'MAIN_DATABASE');
    partnersCol = db.collection(process.env.MONGO_COLLECTION || 'Partner_datas');
    // Indexek (ha szükségesek a regex keresésekhez, gondolkodj text indexen / normalizáláson)
    // await partnersCol.createIndex({ Name: 1 });
    // await partnersCol.createIndex({ Completion_type: 1 });
  } catch (err) {
    console.error('MongoDB connect error:', err);
    process.exit(1);
  }
}

/* ---------- Health & Root ---------- */
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/', (req, res) => res.status(200).send('Hello from Node via Nginx!'));

/* ---------- API: /partners ---------- */
/**
 * Támogatott query paramok:
 * - name: string (részleges, case-insensitive)
 * - completion: string (részleges, case-insensitive)
 * - page: szám (alap: 1)
 * - limit: szám (alap: 20, max: 100)
 * - sort: mezőnév (pl.: Name), prefix '-' fordított sorrendhez (pl.: -Name)
 */
app.get('/partners', async (req, res, next) => {
  try {
    const { name, completion, page = '1', limit = '20', sort } = req.query;

    // Validáció
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    let limitNum = Math.max(parseInt(limit, 10) || 20, 1);
    limitNum = Math.min(limitNum, 100);

    const filters = {};
    if (name && typeof name === 'string') {
      filters.Name = { $regex: name, $options: 'i' };
    }
    if (completion && typeof completion === 'string') {
      filters.Completion_type = { $regex: completion, $options: 'i' };
    }

    // Rendezés
    let sortSpec = {};
    if (sort && typeof sort === 'string') {
      if (sort.startsWith('-')) {
        sortSpec[sort.substring(1)] = -1;
      } else {
        sortSpec[sort] = 1;
      }
    } else {
      sortSpec = { _id: -1 }; // alap rendezés
    }

    const cursor = partnersCol.find(filters)
      .sort(sortSpec)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const [items, total] = await Promise.all([
      cursor.toArray(),
      partnersCol.countDocuments(filters),
    ]);

    res.json({
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      items,
    });
  } catch (err) {
    next(err);
  }
});

/* ---------- Error handler ---------- */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Szerver hiba' });
  }
});

/* ---------- Start ---------- */
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
// FONTOS: reverse proxy mögött elég a loopback – ne legyen közvetlenül publikus
const HOST = process.env.HOST || '127.0.0.1';

initMongo().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT} (${HOST})`);
  });
});

/* ---------- Graceful shutdown ---------- */
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  Promise.resolve()
    .then(() => client.close(true))
    .then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    })
    .catch((e) => {
      console.error('Shutdown error:', e);
      process.exit(1);
    });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
