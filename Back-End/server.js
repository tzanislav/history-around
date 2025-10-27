const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, 'public')));

// API Routes (you can add your API endpoints here)
app.get('/api/health', (req, res) => {
    res.json({ 
        message: 'History Around API is running!', 
        timestamp: new Date().toISOString() 
    });
});

// Example API route for future use
app.get('/api/history', (req, res) => {
    res.json({ 
        message: 'Historical data endpoint',
        data: [] 
    });
});

// Handle React routing - serve React app for all non-API routes
app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err.stack 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 History Around server is running on port ${PORT}`);
    console.log(`📱 React app: http://localhost:${PORT}`);
    console.log(`🔧 API health: http://localhost:${PORT}/api/health`);
});

module.exports = app;