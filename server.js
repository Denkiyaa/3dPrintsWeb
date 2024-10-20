const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3500;

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
