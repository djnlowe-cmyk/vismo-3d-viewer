# Code Examples - BIM/CAD Viewer

This document provides practical code examples for common customizations.

## Basic Usage Examples

### Example 1: Programmatically Add a Model

```javascript
// Add a model at specific GPS coordinates
async function addBuildingModel() {
  const latitude = 40.7128;
  const longitude = -74.0060;
  const elevation = 100;

  const entity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(longitude, latitude, elevation),
    model: {
      uri: '/path/to/model.glb',
      minimumPixelSize: 128,
      maximumScale: 20000,
    },
    properties: {
      name: 'My Building',
      type: 'Commercial',
      height: 100,
      year_built: 2023,
    },
  });

  addModelToList('My Building', entity);
  selectModel(entity);
}

// Call the function
addBuildingModel();
```

### Example 2: Change Viewer Location

```javascript
// Fly camera to new location
function goToLocation(lat, lon, elevation = 500) {
  const destination = Cesium.Cartesian3.fromDegrees(
    lon,
    lat,
    elevation
  );

  viewer.camera.flyTo({
    destination: destination,
    duration: 3,
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: Cesium.Math.toRadians(0)
    }
  });
}

// Usage
goToLocation(40.7128, -74.0060, 600);
```

### Example 3: Add Custom Layer

```javascript
// Add a custom 3D Tiles tileset
async function addCustomTileset(url) {
  try {
    const tileset = await Cesium.Cesium3DTileset.fromUrl(url, {
      maximumScreenSpaceError: 16,
    });
    viewer.scene.primitives.add(tileset);
    console.log('Tileset loaded successfully');
  } catch (error) {
    console.error('Error loading tileset:', error);
  }
}

// Usage
addCustomTileset('https://example.com/tileset.json');
```

## Advanced Examples

### Example 4: Highlight Model on Hover

```javascript
// Highlight models when mouse hovers
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
let highlightedModel = null;

handler.setInputAction((movement) => {
  const pickedObject = viewer.scene.pick(movement.endPosition);

  // Remove previous highlight
  if (highlightedModel) {
    highlightedModel.highlighted = false;
  }

  // Apply new highlight
  if (Cesium.defined(pickedObject) && pickedObject.id) {
    highlightedModel = pickedObject.id;
    pickedObject.id.highlighted = true;
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
```

### Example 5: Add Distance Measurement Tool

```javascript
// Measure distance between points
function activateMeasurementMode() {
  const positions = [];
  const polyline = viewer.entities.add({
    polyline: {
      positions: new Cesium.CallbackProperty(() => positions, false),
      width: 2,
      material: Cesium.Color.RED,
      clampToGround: true,
    },
  });

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  handler.setInputAction((click) => {
    const cartesian = viewer.scene.pickPosition(click.position);
    if (Cesium.defined(cartesian)) {
      positions.push(cartesian);

      // Calculate and display distance
      if (positions.length >= 2) {
        const distance = Cesium.Cartesian3.distance(
          positions[positions.length - 2],
          positions[positions.length - 1]
        );
        console.log(`Distance: ${distance.toFixed(2)} meters`);
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
```

### Example 6: Filter Models by Property

```javascript
// Show/hide models based on property values
function filterModelsByProperty(propertyName, propertyValue) {
  viewer.entities.values.forEach(entity => {
    if (entity.properties && entity.properties[propertyName]) {
      if (entity.properties[propertyName] === propertyValue) {
        entity.show = true;
      } else {
        entity.show = false;
      }
    }
  });
}

// Usage: Show only buildings built after 2020
filterModelsByProperty('year_built', 2023);
```

### Example 7: Export Camera View

```javascript
// Save current camera position
function exportCameraView() {
  const position = viewer.camera.position;
  const heading = viewer.camera.heading;
  const pitch = viewer.camera.pitch;
  const roll = viewer.camera.roll;

  const view = {
    position: {
      x: position.x,
      y: position.y,
      z: position.z,
    },
    heading: Cesium.Math.toDegrees(heading),
    pitch: Cesium.Math.toDegrees(pitch),
    roll: Cesium.Math.toDegrees(roll),
  };

  console.log(JSON.stringify(view, null, 2));
  return view;
}

// Restore camera view
function restoreCameraView(view) {
  viewer.camera.setView({
    destination: new Cesium.Cartesian3(
      view.position.x,
      view.position.y,
      view.position.z
    ),
    orientation: {
      heading: Cesium.Math.toRadians(view.heading),
      pitch: Cesium.Math.toRadians(view.pitch),
      roll: Cesium.Math.toRadians(view.roll),
    },
  });
}
```

### Example 8: Create Polygon/Area

```javascript
// Draw polygon on map
function drawPolygon(coordinates) {
  // coordinates: [[lat, lon], [lat, lon], ...]
  const positions = coordinates.map(coord =>
    Cesium.Cartesian3.fromDegrees(coord[1], coord[0])
  );

  const polygon = viewer.entities.add({
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(positions),
      material: Cesium.Color.BLUE.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.DARKBLUE,
      outlineWidth: 2,
    },
  });

  return polygon;
}

// Usage
drawPolygon([
  [40.7128, -74.0060],
  [40.7200, -74.0100],
  [40.7180, -74.0000],
]);
```

### Example 9: Animate Model

```javascript
// Rotate model continuously
function rotateModel(entity, speed = 1) {
  let rotation = 0;
  const originalPosition = entity.position._value || entity.position;

  viewer.clock.onTick.addEventListener(() => {
    rotation += speed * 0.01;
    if (rotation > Math.PI * 2) rotation = 0;

    // Update entity properties
    if (entity.model) {
      entity.orientation = Cesium.Quaternion.fromAxisAngle(
        Cesium.Cartesian3.UNIT_Z,
        rotation
      );
    }
  });
}
```

### Example 10: Add Labels to Models

```javascript
// Add text labels above models
function addLabel(entity, text) {
  viewer.entities.add({
    position: entity.position,
    label: {
      text: text,
      font: '14pt sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      pixelOffset: new Cesium.Cartesian2(0, -30),
    },
  });
}

// Usage
addLabel(myEntity, 'Building A');
```

## UI Customization Examples

### Example 11: Add Custom Button

```javascript
// Add a custom button to the UI
function addCustomButton(label, callback) {
  const button = document.createElement('button');
  button.textContent = label;
  button.className = 'control-section';
  button.style.width = '100%';
  button.addEventListener('click', callback);

  const controlSection = document.querySelector('.control-section');
  controlSection.parentNode.insertBefore(button, controlSection.nextSibling);
}

// Usage
addCustomButton('Custom Action', () => {
  console.log('Custom button clicked!');
  // Your code here
});
```

### Example 12: Add Status Message

```javascript
// Display status message
function showStatus(message, duration = 3000) {
  const statusDiv = document.createElement('div');
  statusDiv.textContent = message;
  statusDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(0, 102, 255, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 200;
    font-size: 14px;
  `;

  document.body.appendChild(statusDiv);

  setTimeout(() => {
    statusDiv.remove();
  }, duration);
}

// Usage
showStatus('Model loaded successfully!');
```

## Data Integration Examples

### Example 13: Load Models from JSON

```javascript
// Load multiple models from JSON configuration
async function loadModelsFromJSON(jsonUrl) {
  const response = await fetch(jsonUrl);
  const models = await response.json();

  for (const model of models) {
    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        model.longitude,
        model.latitude,
        model.elevation
      ),
      model: {
        uri: model.url,
      },
      properties: model.properties,
    });

    addModelToList(model.name, entity);
  }
}

// Usage with JSON file
loadModelsFromJSON('/data/models.json');
```

### Example 14: Export Model List

```javascript
// Export loaded models to JSON
function exportModelList() {
  const models = [];

  viewer.entities.values.forEach(entity => {
    if (entity.properties && entity.properties.name) {
      const position = entity.position._value || entity.position;
      const cartographic = Cesium.Cartographic.fromCartesian(position);

      models.push({
        name: entity.properties.name,
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        elevation: cartographic.height,
        properties: entity.properties,
      });
    }
  });

  return JSON.stringify(models, null, 2);
}

// Usage
const json = exportModelList();
console.log(json);
```

## Performance Optimization Examples

### Example 15: Batch Load Models

```javascript
// Load multiple models with progress tracking
async function batchLoadModels(modelUrls) {
  const batchSize = 3; // Load 3 at a time
  let loadedCount = 0;

  for (let i = 0; i < modelUrls.length; i += batchSize) {
    const batch = modelUrls.slice(i, i + batchSize);

    const promises = batch.map(async (url) => {
      try {
        const model = await Cesium.Model.fromGltfAsync({ url });
        loadedCount++;
        console.log(`Loaded: ${loadedCount}/${modelUrls.length}`);
        return model;
      } catch (error) {
        console.error(`Failed to load ${url}:`, error);
      }
    });

    await Promise.all(promises);
  }

  console.log('All models loaded!');
}
```

## Integration Examples

### Example 16: URL-based Viewer

```javascript
// Parse URL parameters to set initial view
function initializeFromURL() {
  const params = new URLSearchParams(window.location.search);

  if (params.has('lat') && params.has('lon')) {
    const lat = parseFloat(params.get('lat'));
    const lon = parseFloat(params.get('lon'));
    const elevation = parseFloat(params.get('elev') || '500');

    goToLocation(lat, lon, elevation);
  }

  if (params.has('model')) {
    const modelUrl = params.get('model');
    // Load model from URL
  }
}

// Usage: viewer.html?lat=40.7128&lon=-74.0060&elev=500
initializeFromURL();
```

### Example 17: Keyboard Shortcuts

```javascript
// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
  switch (event.key.toLowerCase()) {
    case 'r':
      viewer.camera.flyHome(2);
      break;
    case 'h':
      document.getElementById('ui-panel').classList.toggle('collapsed');
      break;
    case 'p':
      document.getElementById('properties-panel').classList.toggle('active');
      break;
    case 'delete':
      if (selectedModel) {
        removeModel(selectedModel);
      }
      break;
  }
});
```

## Tips and Best Practices

### Performance Tips
- Use `CallbackProperty` for dynamic properties
- Batch entity updates when possible
- Use `clampToGround` for 2D features
- Minimize number of event listeners

### Accuracy Tips
- Always verify GPS coordinates
- Use WGS84 (EPSG:4326) system
- Convert elevation to meters above sea level
- Test with known locations first

### Code Quality
- Use descriptive variable names
- Comment complex logic
- Handle errors gracefully
- Test edge cases

## Debugging Tips

```javascript
// Enable debug mode
window.DEBUG = true;

function debug(message, data) {
  if (window.DEBUG) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

// Monitor performance
function logPerformance() {
  const fps = 1 / viewer.clock.clockStep;
  const entities = viewer.entities.values.length;
  console.log(`FPS: ${fps}, Entities: ${entities}`);
}

// Get viewer statistics
console.log(viewer.scene.renderingStatistics);
```

For more examples and documentation, visit:
- Cesium Sandcastle: https://sandcastle.cesium.com
- Three.js Examples: https://threejs.org/examples/
- Cesium Forum: https://cesium.com/community/
