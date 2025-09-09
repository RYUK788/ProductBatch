import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const port = 3005; // Use your working port

app.use(cors());
app.use(express.json());

// --- Database Configuration ---
const dbConfig = {
  host: 'devops.golgixai.com',
  user: 'root',
  port: 1434,
  password: 'your_password',
  database: 'icm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// --- Create the connection pool ---
const pool = mysql.createPool(dbConfig);
console.log("✅ Database connection pool created successfully.");

// --- ⚠️ GENERIC/INSECURE ROUTE ---
// This endpoint accepts and runs any query from the client.
app.post('/api/query', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error executing generic query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Keep-Alive Function ---
setInterval(() => {}, 600000);

// --- Start Server ---
app.listen(port, () => {
  console.log(`✅ Server is running and listening on http://localhost:${port}`);
});
