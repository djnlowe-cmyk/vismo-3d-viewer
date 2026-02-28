/**
 * Production Server for BIM/CAD Viewer
 * Serves the built webpack app on Render.com or any Node.js host
 */

const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: false
}));

// Serve public files (sample data)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: false
}));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Internal Server Error');
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 BIM/CAD Viewer running at http://${HOST}:${PORT}`);
  console.log(`📁 Serving from: ${path.join(__dirname, 'dist')}`);
});
