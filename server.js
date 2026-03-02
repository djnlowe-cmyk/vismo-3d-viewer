/**
 * Production Server for BIM/CAD Viewer
 * Serves the built webpack app on Render.com or any Node.js host
 */

const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

// Serve static files from dist directory
app.use(express.static(distPath));

// Serve public files (sample data)
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving: ${distPath}`);
});
