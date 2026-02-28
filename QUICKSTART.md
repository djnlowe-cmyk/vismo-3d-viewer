# Quick Start Guide - BIM/CAD Viewer

## 1. Install Node.js

Download and install Node.js from https://nodejs.org/ (choose LTS version)

Verify installation:
```bash
node --version
npm --version
```

## 2. Install Dependencies

Navigate to the project folder and install dependencies:
```bash
cd 3d-viewer
npm install
```

This will download Cesium.js, Three.js, Webpack, and other required libraries.

## 3. Start the Development Server

Run the development server:
```bash
npm run dev
```

Your browser will automatically open to `http://localhost:3000`

## 4. Explore the Viewer

### What You'll See
- OSM 3D buildings in the background
- A sample blue cube building in New York City
- Control panel on the right side

### First Steps
1. **Try the Sample**: Click on the sample building - a properties panel appears
2. **Navigate**:
   - Drag mouse to rotate
   - Scroll to zoom
   - Right-click drag to pan
3. **Change Location**: Enter different lat/lon coordinates and click "Go to Location"
4. **Toggle Layers**: Try showing/hiding OSM Buildings, Terrain, and Imagery

## 5. Load Your Own Models

### Prepare Your Model
1. Convert to glTF format (recommended):
   - Use Babylon.js Sandbox: https://www.babylonjs-playground.com
   - Or other online converters
2. Have your GPS coordinates ready (latitude, longitude, elevation)

### Upload Model
1. Set latitude/longitude/elevation in the control panel
2. Click the file input to select your glTF/glB file
3. Model will load and appear on the map

## 6. Build for Production

When ready to deploy:
```bash
npm run build
```

This creates optimized files in the `dist/` folder.

## Common Tasks

### Change Default Location
Edit `src/index.js` line 53-54:
```javascript
const latitude = 40.7128; // Change this
const longitude = -74.006; // Change this
```

### Add Your Cesium Ion Token
1. Visit https://cesium.com/ion (free account)
2. Copy your access token
3. Replace token in `src/index.js` line 6

### Adjust Camera Controls
Edit `src/index.js` lines 237-250:
```javascript
const destination = Cesium.Cartesian3.fromDegrees(longitude, latitude, elevation + 500);
viewer.camera.flyTo({
  destination: destination,
  duration: 2, // Change flight duration here
  ...
});
```

### Enable Debug Mode
Add to `src/index.js` after line 6:
```javascript
if (true) { // Set to false to disable
  window.CESIUM_BASE_URL = '/cesium-static/';
  Cesium.RequestScheduler.requestsByServer['tile.openstreetmap.se'] = 18;
}
```

## Supported File Formats

| Format | Status | Notes |
|--------|--------|-------|
| glTF/glB | ✅ Recommended | Fastest, best compatibility |
| OBJ | ✅ Basic | Limited material support |
| IFC | ⚠️ Convert First | Use online IFC-to-glTF tools |
| FBX | ⚠️ Convert First | Convert via Babylon.js Sandbox |
| DAE | ⚠️ Convert First | Convert via Babylon.js Sandbox |

## Tips for Best Results

### Model Size
- Keep models under 50MB for smooth loading
- Use compression where possible
- Delete unnecessary geometry

### Positioning
- Always use WGS84 coordinates (lat/lon)
- Verify elevation in meters
- Test with a known location first

### Performance
- Close properties panel when not needed
- Don't load too many models at once
- Use LOD (level of detail) in your models

## Troubleshooting

### Blank screen appears
- Check browser console (F12 → Console tab)
- Verify internet connection
- Try a different browser

### Model not visible
- Verify GPS coordinates are correct
- Try "Reset View" button
- Check file size isn't too large

### Slow performance
- Close unused models
- Toggle off imagery/terrain if not needed
- Use lower resolution settings

## Next Steps

1. **Customize**: Edit `src/config.js` to adjust settings
2. **Style**: Modify `src/style.css` for your branding
3. **Features**: Add custom tools in `src/index.js`
4. **Deploy**: Build and host on your server

## Getting Help

- Cesium Documentation: https://cesium.com/learn/
- Cesium Forum: https://cesium.com/community/
- GitHub Issues: Create an issue in your repo
- Three.js Docs: https://threejs.org/docs/

## Next-Level Features

Once comfortable with basics, try:
- Custom measurement tools
- Model comparison mode
- Property filtering
- Annotation tools
- Animation playback
- GeoJSON overlays

Good luck! 🚀
