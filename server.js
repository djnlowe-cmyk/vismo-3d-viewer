/**
 * Production Server for BIM/CAD Viewer
 * Serves the built webpack app on Render.com or any Node.js host
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error(`❌ ERROR: dist folder not found at ${distPath}`);
  console.error('Please run: npm run build');
  process.exit(1);
}

console.log(`✓ Dist folder found at: ${distPath}`);

// Serve static files from dist directory
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: false
}));

// Serve public files (sample data)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: false
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ index.html not found at ${indexPath}`);
    return res.status(404).send('index.html not found');
  }
  res.sendFile(indexPath);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Internal Server Error');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BIM/CAD Viewer running on port ${PORT}`);
  console.log(`📁 Serving from: ${distPath}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
