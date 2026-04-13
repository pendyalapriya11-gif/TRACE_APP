require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
console.log("ENV CHECK:", process.env.DB_USER, process.env.NODE_ENV);

const express = require('express');
const cors = require('cors');


const authRoutes = require('./routes/auth');
const logRoutes = require('./routes/logs');
const app = express();

// Middleware
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'TRACE API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV}`);
});

console.log("DB_USER:", process.env.DB_USER);
console.log("NODE_ENV:", process.env.NODE_ENV);

const path = require('path');

app.use(express.static(path.join(__dirname, '../frontend')));