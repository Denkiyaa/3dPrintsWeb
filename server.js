const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

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

    fs.readdir(modelsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to scan models directory' });
        }

        const stlFiles = files.filter(file => file.endsWith('.stl'));
        const models = stlFiles.map(file => {
            const modelName = path.basename(file, '.stl');
            return {
                name: modelName,
                modelPath: `/models/${file}`,
                thumbnailPath: `/thumbnails/${modelName}.png` // Assuming thumbnail images exist in the public/thumbnails folder
            };
        });

        res.json({ models });
    });
});

// Listen on all interfaces (important for remote server)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
