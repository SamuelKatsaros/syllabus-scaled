const express = require('express');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV === 'development';

// Improved error logging
const logError = (message, error) => {
  console.error(`${message}:`, error);
  fs.appendFileSync('error.log', `${new Date().toISOString()} - ${message}: ${error}\n`);
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS syllabi (
        id SERIAL PRIMARY KEY,
        course TEXT NOT NULL,
        courseNumber TEXT NOT NULL,
        title TEXT NOT NULL,
        professor TEXT NOT NULL,
        semester TEXT NOT NULL,
        filename TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Syllabi table created or already exists');
    client.release();
    return Promise.resolve();
  } catch (err) {
    logError('Error initializing database', err);
    return Promise.reject(err);
  }
};

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('Received upload request');
  const { course, courseNumber, title, professor, semester } = req.body;
  const filename = req.file ? req.file.filename : null;

  if (!filename) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const capitalizedCourse = course.toUpperCase();

  try {
    const result = await pool.query(
      `INSERT INTO syllabi (course, courseNumber, title, professor, semester, filename) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [capitalizedCourse, courseNumber, title, professor, semester, filename]
    );

    console.log(`Syllabus inserted with ID: ${result.rows[0].id}`);
    res.json({
      id: result.rows[0].id,
      course: capitalizedCourse,
      courseNumber,
      title,
      professor,
      semester,
      filename
    });
  } catch (err) {
    logError('Error inserting syllabus', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/syllabi', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM syllabi ORDER BY id DESC");
    console.log(`Fetched ${result.rows.length} syllabi`);
    res.json({
      syllabi: result.rows,
      totalItems: result.rows.length
    });
  } catch (err) {
    logError('Error fetching syllabi', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/departments', async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT course FROM syllabi ORDER BY course");
    res.json(result.rows.map(row => row.course));
  } catch (err) {
    logError('Error fetching departments', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT course || ' ' || courseNumber as course FROM syllabi ORDER BY course, courseNumber");
    res.json(result.rows.map(row => row.course));
  } catch (err) {
    logError('Error fetching courses', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/semesters', async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT semester FROM syllabi ORDER BY semester");
    res.json(result.rows.map(row => row.semester));
  } catch (err) {
    logError('Error fetching semesters', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/professors', async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT professor FROM syllabi ORDER BY professor");
    res.json(result.rows.map(row => row.professor));
  } catch (err) {
    logError('Error fetching professors', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/syllabi/:id', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM syllabi WHERE id = $1", [req.params.id]);
    if (result.rows[0]) {
      const filePath = path.join(uploadDir, result.rows[0].filename);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        logError('File not found', `${filePath}`);
        res.status(404).send('Syllabus file not found');
      }
    } else {
      res.status(404).send('Syllabus not found');
    }
  } catch (err) {
    logError('Error fetching syllabus', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use((err, req, res, next) => {
  logError('Unhandled error', err);
  res.status(500).send('Something broke!');
});

initializeDatabase()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port} in ${isDev ? 'development' : 'production'} mode`);
    });
  })
  .catch((err) => {
    logError('Failed to initialize database', err);
    process.exit(1);
  });

process.on('uncaughtException', (err) => {
  logError('Uncaught Exception', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection', reason);
  process.exit(1);
});