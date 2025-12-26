const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// CORS set karyu che
app.use(cors());

// Image upload mate limit vadhari che (Base64 mate aa jaruri che)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 5000;

connectDB();

// Routes configuration
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sales', require('./routes/sales'));

app.get('/', (req, res) => res.send('Fresh Grocer API'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));