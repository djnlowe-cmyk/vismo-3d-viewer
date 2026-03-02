/**
 * Production Server for BIM/CAD Viewer
 * Serves the built webpack app on Render.com or any Node.js host
 */

console.log('Server.js is starting...');

try {
  const express = require('express');
  const path = require('path');

  console.log('Express loaded successfully');

  const app = express();
  const PORT = process.env.PORT || 3000;
  const distPath = path.join(__dirname, 'dist');

  console.log(`Port: ${PORT}`);
  console.log(`Dist path: ${distPath}`);

  // Serve static files from dist directory
  app.use(express.static(distPath));
  app.use(express.static(path.join(__dirname, 'public')));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  const server = app.listen(PORT, () => {
    console.log(`✅ SERVER STARTED ON PORT ${PORT}`);
    console.log(`📁 Serving from: ${distPath}`);
  });

  server.on('error', (err) => {
    console.error(`❌ Server error: ${err.message}`);
  });

} catch (err) {
  console.error(`❌ Fatal error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}
