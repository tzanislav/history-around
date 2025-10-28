const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if public directory exists
const publicPath = path.join(__dirname, 'public');
const fs = require('fs');

// Serve static files from the React app build (if it exists)
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    console.log('✅ Serving React app from public/ directory');
} else {
    console.log('⚠️  React build not found. Run "npm run build" to build the React app.');
}

// API Routes (you can add your API endpoints here)
app.get('/api/health', (req, res) => {
    const publicExists = fs.existsSync(publicPath);
    const unityBuildPath = path.join(publicPath, 'Build');
    const unityBuildExists = fs.existsSync(unityBuildPath);
    const unityFiles = unityBuildExists ? fs.readdirSync(unityBuildPath) : [];
    
    res.json({ 
        message: 'History Around API is running!', 
        timestamp: new Date().toISOString(),
        reactBuildExists: publicExists,
        unityBuildExists: unityBuildExists,
        unityFiles: unityFiles,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Debug endpoint to check Unity files
app.get('/api/unity-status', (req, res) => {
    const unityBuildPath = path.join(publicPath, 'Build');
    const requiredFiles = ['Web.loader.js', 'Web.framework.js', 'Web.data', 'Web.wasm'];
    const fileStatus = {};
    
    requiredFiles.forEach(file => {
        const filePath = path.join(unityBuildPath, file);
        fileStatus[file] = {
            exists: fs.existsSync(filePath),
            path: filePath,
            url: `/Build/${file}`
        };
    });
    
    res.json({
        message: 'Unity build file status',
        buildPath: unityBuildPath,
        files: fileStatus,
        allFilesExist: requiredFiles.every(file => fileStatus[file].exists)
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
    
    // Check if React build exists
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // React build not found - provide helpful message
        res.status(404).json({
            error: 'React app not built',
            message: 'Please run "npm run build" to build the React application',
            instructions: [
                '1. Navigate to the project root directory',
                '2. Run: npm run build (in Back-End folder)',
                '3. This will build React and copy files to public/',
                '4. Restart the server'
            ]
        });
    }
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