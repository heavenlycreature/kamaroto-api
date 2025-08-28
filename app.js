const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
// middleware file imports
const errorHandler = require('./middleware/errorHandler');

// routes file imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mitraRoutes = require('./routes/mitraRoutes');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
// ... rute lainnya

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/admin', adminRoutes);
app.use('/mitra', mitraRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Kamaroto Backend API is running!');
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
