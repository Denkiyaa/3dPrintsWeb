const express = require('express');
const path = require('path');
const multer = require('multer');

const app = express();

// Middleware for parsing incoming data and setting static directories
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
  res.render('index', { title: '3D Print Models Gallery' });
});

app.post('/upload', upload.single('model'), (req, res) => {
  console.log(req.file);
  res.redirect('/');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
