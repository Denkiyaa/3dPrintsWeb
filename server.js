const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000; // Use environment variable for remote server, default to 3500 for local

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Endpoint to dynamically get the list of STL model files
app.get('/models-list', (req, res) => {
    const modelsDir = path.join(__dirname, 'public', 'models');
    
    // Read all files in the models directory
    fs.readdir(modelsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to scan models directory' });
        }

        // Filter for STL files only
        const stlFiles = files.filter(file => file.endsWith('.stl'));

        // Return the list of STL files
        res.json({ models: stlFiles });
    });
});

// Listen on all interfaces (important for remote server)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT} or remote server using PORT ${PORT}`);
});
