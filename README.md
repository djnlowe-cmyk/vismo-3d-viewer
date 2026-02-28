# BIM/CAD Viewer with OSM 3D Tiles

A professional-grade 3D viewer application for Building Information Models (BIM) and CAD drawings with real-world geospatial context using OpenStreetMap 3D Tiles.

## Features

### Geospatial Integration
- **OSM 3D Tiles Background**: Real-time 3D building data from OpenStreetMap
- **Terrain Rendering**: Elevation data with realistic terrain
- **Satellite Imagery**: Option to overlay satellite imagery
- **GPS Coordinate System**: Position BIM models at real-world locations using latitude/longitude
- **Multi-Site Support**: Easily switch between different project locations

### BIM/CAD Support
- **Multiple Format Support**:
  - glTF/glB (recommended - fastest loading)
  - OBJ (basic support)
  - IFC (requires conversion to glTF)
  - FBX/DAE (requires conversion)
- **Model Positioning**: Place models at precise GPS coordinates with elevation
- **Layer Management**: Toggle visibility of different model layers
- **Property Inspector**: View model metadata and properties

### Visualization
- **3D Navigation**: Smooth camera controls with mouse and keyboard
- **Lighting Controls**: Adjust ambient and directional lighting
- **Material Rendering**: Support for PBR materials in glTF models
- **Shadow Support**: Real-time shadow rendering
- **Opacity Control**: Adjust model transparency

### User Interface
- **Collapsible Control Panel**: Organized controls on the right side
- **Properties Panel**: Click models to view detailed information
- **Model List**: Manage loaded BIM/CAD models
- **Navigation Tools**: Zoom, pan, reset view, fly-to location

## Prerequisites

- Node.js 16+ (download from https://nodejs.org/)
- npm or yarn
- Modern web browser with WebGL support

## Installation

1. Navigate to the project directory:
```bash
cd 3d-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Set up Cesium Ion token (optional but recommended):
   - Visit https://cesium.com/ion
   - Create a free account
   - Get your access token
   - Replace the token in `src/index.js` line 6:
   ```javascript
   Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN_HERE';
   ```

## Development

Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000` with hot reloading enabled.

## Production Build

Create an optimized production build:
```bash
npm run build
```

The built files will be in the `dist/` directory, ready to deploy.

## Usage Guide

### Loading Models

1. **Load Sample Building**: Click "Load Sample Building" button to see a demonstration model
2. **Upload Your Model**:
   - Click the file input to select a glTF/glB file from your computer
   - Or drag and drop a file onto the input area
   - The model will be placed at the specified GPS coordinates

### Navigation

- **Rotate**: Click and drag with mouse
- **Zoom**: Scroll mouse wheel
- **Pan**: Right-click and drag
- **Fly to Location**: Enter latitude/longitude/elevation and click "Go to Location"
- **Reset View**: Click "Reset View" button

### Managing Layers

Toggle visibility of background layers:
- **OSM Buildings**: Show/hide 3D building data from OpenStreetMap
- **Terrain**: Show/hide elevation terrain
- **Satellite Imagery**: Show/hide aerial photography

### Properties and Information

- **Click on Models**: Click any model to select it and view properties
- **Properties Panel**: View detailed information including:
  - Model name and type
  - GPS coordinates
  - Elevation
  - File format
  - Custom metadata

### Display Options

- **Model Opacity**: Use the slider to adjust transparency of loaded models
- **Show Properties**: Toggle the properties panel visibility
- **Hide Controls**: Collapse the control panel for a larger viewing area

## File Format Details

### Supported Formats

**glTF/glB (Recommended)**
- Fast loading and rendering
- Support for materials, textures, and animations
- Best compatibility across browsers
- File size: Usually smaller than original

**OBJ**
- Basic 3D geometry
- Limited material support
- Requires MTL file in same directory

**IFC (Requires Conversion)**
- Standard BIM format
- Must be converted to glTF first
- Tools: Speckle, BIMServer, or commercial converters

**FBX/DAE (Requires Conversion)**
- Requires conversion to glTF format
- Use Babylon.js Sandbox or similar tools

### Converting Models to glTF

1. **AutoCAD/Revit to glTF**:
   - Export to FBX from your CAD software
   - Use online converter: https://babylon.js-playground.com
   - Export the converted model

2. **IFC to glTF**:
   - Use IFC-to-gltf-converter tools
   - Or upload to Speckle and export as glTF

## Tips and Best Practices

### Performance
- Use glTF/glB format for best performance
- Keep model file sizes under 50MB when possible
- Limit the number of visible high-resolution models
- Use appropriate level-of-detail (LOD) in your models

### Accuracy
- Verify GPS coordinates (latitude, longitude, elevation) before positioning
- Use WGS84 coordinate system
- Elevation should be in meters above sea level (or local datum)

### Organization
- Use descriptive names for your BIM/CAD models
- Group related models into single files when possible
- Clean up unused models using the remove button

## Technical Architecture

### Technology Stack
- **Cesium.js**: Geospatial 3D mapping engine
- **Three.js**: 3D graphics rendering (integrated via Cesium)
- **Webpack**: Module bundler
- **WebGL**: Hardware-accelerated graphics

### Data Flow
1. Cesium viewer renders OSM 3D Tiles as background
2. BIM/CAD models loaded as glTF entities
3. Models positioned using GPS coordinates
4. User interactions handled through event listeners
5. Properties stored and displayed on selection

## Troubleshooting

### Models not appearing
- Verify GPS coordinates are valid (lat: -90 to 90, lon: -180 to 180)
- Check browser console for error messages
- Ensure model file format is supported
- Try a sample glTF model first

### 3D Tiles not loading
- Check internet connection (tiles load from cloud)
- Verify Cesium Ion token is valid
- Check browser console for CORS errors
- Try disabling ad blockers

### Performance issues
- Reduce number of loaded models
- Use lower resolution imagery
- Close properties panel if not needed
- Clear browser cache and reload

### File upload not working
- Use supported file formats only
- Check file size (should be under 100MB)
- Verify browser allows file access
- Try different browser if issue persists

## Known Limitations

- IFC format requires pre-conversion to glTF
- OBJ format has basic material support only
- Large models (>100MB) may have loading/performance issues
- Some CAD-specific metadata may be lost during format conversion
- Animations in glTF models currently not played

## Future Enhancements

Potential features for future versions:
- Direct IFC file support using web-ifc library
- Advanced measurement tools
- Model comparison (as-built vs as-designed)
- Collaboration features (multi-user viewing)
- GeoJSON/KML import for site data
- Advanced filtering by property values
- Model export to glTF/OBJ
- Lighting analysis tools
- Accessibility compliance checks

## Credits

- **Cesium.js**: https://cesium.com
- **OpenStreetMap**: https://www.openstreetmap.org
- **Three.js**: https://threejs.org

## License

MIT License - feel free to use and modify for your projects

## Support

For issues, questions, or feature requests:
1. Check the troubleshooting section
2. Review Cesium.js documentation: https://cesium.com/learn/
3. Check Three.js documentation: https://threejs.org/docs/
4. Open an issue in the project repository

## Resources

### Learning Resources
- Cesium.js Tutorials: https://cesium.com/learn/
- Three.js Examples: https://threejs.org/examples/
- glTF Format Spec: https://www.khronos.org/gltf/
- WebGL Documentation: https://www.khronos.org/webgl/

### Useful Tools
- Babylon.js Sandbox (format conversion): https://www.babylonjs-playground.com
- Cesium Ion (asset hosting): https://cesium.com/ion
- Three.js Editor: https://threejs.org/editor/
- glTF Validators: https://www.khronos.org/gltf/validators/

### Data Sources
- OpenStreetMap: https://www.openstreetmap.org
- Copernicus DEM (elevation): https://www.copernicus.eu/
- USGS 3DEP (US elevation): https://www.usgs.gov/3DEP
