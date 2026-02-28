/**
 * BIM/CAD Viewer Configuration
 * Customize these settings to tailor the viewer to your needs
 */

export const Config = {
  // Cesium Settings
  cesium: {
    // Your Cesium Ion token - get one at https://cesium.com/ion
    ionToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjNDAxYTQxNC1iMWYyLTQ3MTctOWQwMi01Y2JjNDZkMjhjNjgiLCJpZCI6MTMzODMsImlhdCI6MTcwMDQ5OTk2OH0.t2H1IKoFkCDhYGrTp8cEzTWVb0YjRQEBH9bJgIXqmOQ',

    // Default location (latitude, longitude, height in meters)
    defaultLocation: {
      latitude: 40.7128,
      longitude: -74.006,
      height: 100,
    },

    // OSM 3D Tiles settings
    osm3DTiles: {
      url: 'https://tile.openstreetmap.se/data/buildings/tileset.json',
      maximumScreenSpaceError: 16,
      maximumMemoryUsage: 1024,
    },
  },

  // Model Loading Settings
  models: {
    // Maximum file size in MB
    maxFileSize: 100,

    // Supported file formats
    supportedFormats: ['glb', 'gltf', 'las', 'laz', 'obj', 'ifc', 'fbx', 'dae'],

    // Default position for new models
    defaultPosition: {
      latitude: 40.7128,
      longitude: -74.006,
      elevation: 100,
    },

    // Default scale for loaded models
    defaultScale: 1.0,
  },

  // Point Cloud Settings (LAS/LAZ)
  pointCloud: {
    // Default point size
    defaultPointSize: 1,

    // Default color mode: 'rgb', 'elevation', 'intensity'
    defaultColorMode: 'rgb',

    // Enable Level-of-Detail (LOD) for large point clouds
    enableLOD: false,

    // Number of points before LOD kicks in
    lodThreshold: 5000000,

    // LOD factor: render every Nth point (0.1 = 10% of points)
    lodFactor: 0.5,

    // Color mapping settings
    colorMapping: {
      // Elevation gradient min/max (in meters)
      elevationMin: 0,
      elevationMax: 1000,

      // Intensity mapping range (0-65535)
      intensityMin: 0,
      intensityMax: 65535,
    },

    // Maximum file size in MB
    maxFileSize: 500,
  },

  // Camera Settings
  camera: {
    // Default camera position after loading
    defaultHeading: 0, // degrees
    defaultPitch: -45, // degrees
    defaultZoom: 500, // meters

    // Camera flight duration
    flyDuration: 2, // seconds

    // Zoom limits
    minZoom: 10,
    maxZoom: 10000,
  },

  // Lighting Settings
  lighting: {
    // Ambient light intensity (0-2)
    ambientLightIntensity: 0.6,

    // Directional light intensity (0-2)
    directionalLightIntensity: 1.0,

    // Enable shadows by default
    enableShadows: true,
  },

  // Display Settings
  display: {
    // Default model opacity (0-1)
    defaultOpacity: 1.0,

    // Enable LOD (level of detail) rendering
    enableLOD: true,

    // Background color (RGB hex)
    backgroundColor: '#2a2a2a',

    // UI theme
    theme: 'dark', // 'dark' or 'light'
  },

  // Layer Settings
  layers: {
    // Show/hide specific layers by default
    osmBuildings: true,
    terrain: true,
    imagery: true,

    // Terrain provider
    terrainProvider: 'WorldTerrain',

    // Imagery provider options
    imagery: {
      provider: 'OpenStreetMap',
      layers: ['Mapnik'],
    },
  },

  // UI Settings
  ui: {
    // Show properties panel by default
    showProperties: true,

    // Collapsible control panel
    collapsiblePanel: true,

    // Show grid overlay
    showGrid: false,

    // Show compass
    showCompass: true,

    // Show navigation help
    showNavigationHelp: true,
  },

  // Performance Settings
  performance: {
    // Enable worker threads for model loading
    useWorkers: true,

    // Maximum number of concurrent model loads
    maxConcurrentLoads: 3,

    // Enable frustum culling
    frustumCulling: true,

    // Cache loaded models
    enableCache: true,
  },

  // Geospatial Settings
  geospatial: {
    // Coordinate reference system
    crs: 'EPSG:4326', // WGS84

    // Elevation datum (in meters above sea level)
    elevationDatum: 0,

    // Distance units
    distanceUnit: 'meters',

    // Area units
    areaUnit: 'square_meters',
  },

  // Export/Import Settings
  export: {
    // Supported export formats
    formats: ['glb', 'gltf', 'obj', 'json'],

    // Include metadata in exports
    includeMetadata: true,

    // Compress exported files
    compress: true,
  },

  // Advanced Settings
  advanced: {
    // Enable debug mode (logs to console)
    debug: false,

    // Enable ray casting for precise picking
    enableRayCasting: true,

    // Order-independent transparency
    orderIndependentTranslucency: true,

    // Depth testing against terrain
    depthTestAgainstTerrain: true,

    // Request render mode (automatically render only when needed)
    requestRenderMode: false,
  },

  // Keyboard Shortcuts
  shortcuts: {
    showGrid: 'g',
    toggleProperties: 'p',
    resetView: 'r',
    togglePanel: 'h',
    toggleFullscreen: 'f',
    deleteSelected: 'Delete',
  },

  // IFC Settings (Industry Foundation Classes BIM format)
  ifc: {
    // Default color mode for IFC elements
    defaultColorMode: 'type', // 'type', 'storey', or 'uniform'

    // Element type visibility defaults
    elementVisibility: {
      walls: true,
      doors: true,
      windows: true,
      slabs: true,
      beams: true,
      columns: true,
      stairs: true,
      furniture: true,
    },

    // Maximum file size in MB
    maxFileSize: 200,

    // Enable LOD for large models
    enableLOD: false,

    // Color overrides (optional)
    colors: {
      walls: '#888888',
      doors: '#FF6B00',
      windows: '#87CEEB',
      slabs: '#8B7355',
      columns: '#696969',
      default: '#CCCCCC'
    }
  },

  // Feature Flags (for experimental features)
  features: {
    // Enable experimental IFC loader
    enableIFCLoader: true,

    // Enable measurement tools
    enableMeasurementTools: false,

    // Enable model comparison mode
    enableComparison: false,

    // Enable collaboration features
    enableCollaboration: false,
  },
};

export default Config;
