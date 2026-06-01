require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const session = require('express-session');

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const billingRoutes = require('./routes/billingRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

const app = express();

// Trust proxy for secure cookies on Render
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Session setup
app.use(session({
  secret: 'your_secret_key', // use a strong, random secret in production!
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Middleware setup
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      origin.includes('vercel.app');
    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error('CORS block: Origin not allowed'), false);
  },
  credentials: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static directories
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register API and view routes
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', orderRoutes);
app.use('/', billingRoutes);
app.use('/', campaignRoutes);
app.use('/', inventoryRoutes);

// Wildcard fallback for React SPA client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// Connect to Database and start server
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});