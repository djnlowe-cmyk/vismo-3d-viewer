import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { parseLAS } from './loaders/las-parser.js';
import { createPointCloud, setPointSize, applyColorMode } from './loaders/las-loader.js';
import { parseIFC, IFC_TYPES } from './loaders/ifc-parser.js';
import { createIFCModel, getIFCModelBounds, setElementTypeVisibility, setElementTypeColor, highlightIFCElement, getIFCElementsByType } from './loaders/ifc-loader.js';
import { router } from './utils/router.js';
import { dashboard } from './views/dashboard.js';
import { projectsAPI } from './api/projects.js';
import './style.css';
import './views/dashboard.css';

// ========================================
// ROUTER INITIALIZATION
// ========================================

// Initialize router and register routes
async function initializeRouter() {
  console.log('🚀 Initializing Vismo 3D Viewer');

  // Dashboard route
  router.register('/', async () => {
    console.log('📊 Loading dashboard view');
    const viewerContainer = document.getElementById('viewer-container');
    viewerContainer.style.display = 'none';
    await dashboard.init();
  }, () => {
    dashboard.cleanup();
  });

  // Project viewer route
  router.register('/viewer/:id', async (params) => {
    console.log(`👁️  Loading viewer for project ${params.id}`);
    const viewerContainer = document.getElementById('viewer-container');
    viewerContainer.style.display = 'block';

    // Initialize 3D viewer if not already done
    if (!window.vismoViewerInitialized) {
      initializeViewer();
      window.vismoViewerInitialized = true;
    }

    // Load project
    try {
      const project = await projectsAPI.getProject(params.id);
      console.log('✅ Project loaded:', project);
      // TODO: Load project model from S3 URL in Phase 4
      alert(`Project loaded: ${project.name}\nS3 URL loading coming in Phase 4`);
    } catch (err) {
      console.error('Error loading project:', err);
      alert('Failed to load project. Returning to dashboard.');
      router.navigate('/');
    }
  });

  // Profile route (stub for now)
  router.register('/profile', async () => {
    console.log('👤 Loading profile view');
    alert('Profile view coming in Phase 5');
    router.navigate('/');
  });

  // Navigate to dashboard on initial load
  window.addEventListener('load', () => {
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
  });
}

// Initialize router immediately
initializeRouter();

// ========================================
// VIEWER INITIALIZATION
// ========================================
// The Three.js viewer initializes automatically on page load
// This function is called when the viewer route is activated
function initializeViewer() {
  // Three.js scene is already set up on page load
  // Just ensure the animation loop is running
  if (!window.vismoAnimating) {
    console.log('▶️  Starting 3D viewer animation loop');
    window.vismoAnimating = true;
    // animate() is called at the bottom of the file
  }
}

const cesiumContainer = document.getElementById('cesium-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 1000, 3000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 50, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
cesiumContainer.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
scene.add(directionalLight);

const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.8
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const gridHelper = new THREE.GridHelper(200, 20, 0x444466, 0x333344);
gridHelper.position.y = 0.1;
scene.add(gridHelper);

let currentModel = null;
let loadedModels = [];
const gltfLoader = new GLTFLoader();

// Geolocation and map positioning
let currentLocation = {
  latitude: 51.5074,  // London default
  longitude: -0.1278,
  elevation: 100
};

// Camera look-at point (center of view)
let cameraLookAtPoint = new THREE.Vector3(0, 30, 0);

// Map tile system with local caching
class MapTileCache {
  constructor() {
    this.cache = new Map();
    this.loadingQueue = new Set();
  }

  // Convert lat/lon to tile coordinates at zoom level (Web Mercator)
  latlonToTile(lat, lon, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const latRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { x, y, z: zoom };
  }

  // Get tile URL from OSM
  getTileUrl(x, y, z) {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }

  // Get from cache or load from server
  async getTile(x, y, z) {
    const key = `${z}/${x}/${y}`;

    // Check cache first
    if (this.cache.has(key)) {
      console.log(`[CACHE] Hit for ${key}`);
      return this.cache.get(key);
    }

    // Avoid duplicate requests
    if (this.loadingQueue.has(key)) {
      console.log(`[CACHE] Already loading ${key}`);
      return null;
    }

    this.loadingQueue.add(key);

    try {
      const url = this.getTileUrl(x, y, z);
      console.log(`[FETCH] Requesting ${key} from ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BIM-CAD-Viewer/1.0'
        }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      console.log(`[FETCH] ✓ Got blob for ${key}, size: ${blob.size} bytes`);

      const imageUrl = URL.createObjectURL(blob);

      // Cache the tile
      this.cache.set(key, imageUrl);
      this.loadingQueue.delete(key);

      console.log(`[CACHE] Cached ${key} -> ${imageUrl.substring(0, 50)}...`);
      return imageUrl;
    } catch (error) {
      console.warn(`[FETCH] ✗ Failed to load tile ${key}:`, error);
      this.loadingQueue.delete(key);
      return null;
    }
  }

  // Clear cache
  clear() {
    this.cache.forEach(url => URL.revokeObjectURL(url));
    this.cache.clear();
  }
}

const tileCache = new MapTileCache();

// Load OSM tiles for current location
async function loadMapTiles(latitude, longitude, zoom = 15) {
  try {
    console.log(`[MAP] Loading tiles for ${latitude.toFixed(4)}, ${longitude.toFixed(4)} at zoom ${zoom}`);

    // Get center tile
    const centerTile = tileCache.latlonToTile(latitude, longitude, zoom);
    console.log(`[MAP] Center tile: ${zoom}/${centerTile.x}/${centerTile.y}`);

    // Load a 3x3 grid of tiles around center
    const canvas = document.createElement('canvas');
    canvas.width = 256 * 3;
    canvas.height = 256 * 3;
    const ctx = canvas.getContext('2d');

    // Fill with light gray background first
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    console.log('[MAP] Canvas created and filled with background');

    const tilePromises = [];
    let loadedCount = 0;
    let failedCount = 0;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const x = centerTile.x + dx;
        const y = centerTile.y + dy;
        const canvasX = (dx + 1) * 256;
        const canvasY = (dy + 1) * 256;

        const tilePromise = new Promise((resolve) => {
          console.log(`[MAP] Fetching tile ${zoom}/${x}/${y}...`);

          tileCache.getTile(x, y, zoom).then(imageUrl => {
            if (imageUrl) {
              const img = new Image();
              img.crossOrigin = 'Anonymous';

              img.onload = () => {
                ctx.drawImage(img, canvasX, canvasY, 256, 256);
                console.log(`[MAP] ✓ Drew tile ${zoom}/${x}/${y} to canvas at (${canvasX}, ${canvasY})`);
                loadedCount++;
                resolve();
              };

              img.onerror = (err) => {
                console.warn(`[MAP] ✗ Image failed to load for ${zoom}/${x}/${y}:`, err);
                // Draw fallback
                ctx.fillStyle = '#888888';
                ctx.fillRect(canvasX, canvasY, 256, 256);
                ctx.strokeStyle = '#666666';
                ctx.strokeRect(canvasX, canvasY, 256, 256);
                failedCount++;
                resolve();
              };

              img.src = imageUrl;
            } else {
              console.warn(`[MAP] No URL returned for tile ${zoom}/${x}/${y}`);
              // Draw fallback
              ctx.fillStyle = '#aaaaaa';
              ctx.fillRect(canvasX, canvasY, 256, 256);
              failedCount++;
              resolve();
            }
          }).catch((err) => {
            console.error(`[MAP] Fetch error for tile ${zoom}/${x}/${y}:`, err);
            ctx.fillStyle = '#aaaaaa';
            ctx.fillRect(canvasX, canvasY, 256, 256);
            failedCount++;
            resolve();
          });
        });

        tilePromises.push(tilePromise);
      }
    }

    console.log(`[MAP] Waiting for ${tilePromises.length} tile promises...`);

    // Wait for all tiles to finish loading and drawing
    await Promise.all(tilePromises);

    console.log(`[MAP] All tiles processed: ${loadedCount} loaded, ${failedCount} failed`);

    // Give a moment for final renders
    await new Promise(resolve => setTimeout(resolve, 100));

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;

    // Apply to ground
    const groundMaterial = ground.material;
    if (groundMaterial.map) {
      groundMaterial.map.dispose();
    }
    groundMaterial.map = texture;
    groundMaterial.needsUpdate = true;

    console.log(`[MAP] ✓ Map tiles applied to ground material`);
    return true;
  } catch (error) {
    console.error('[MAP] Error loading map tiles:', error);
    return false;
  }
}

// Load tiles for London on startup
loadMapTiles(51.5074, -0.1278, 15);

function createSampleBuilding() {
  if (currentModel) scene.remove(currentModel);

  const geometry = new THREE.BoxGeometry(30, 50, 30);
  const material = new THREE.MeshStandardMaterial({ color: 0x0066ff, metalness: 0.3, roughness: 0.5, transparent: true });
  currentModel = new THREE.Mesh(geometry, material);
  currentModel.castShadow = true;
  currentModel.position.y = 0; // Place on ground (Y=0)
  scene.add(currentModel);

  // Store original scale
  originalModelScale.copy(currentModel.scale);

  // Reset transform controls
  modelTransform.scale = 1;
  modelTransform.rotationX = 0;
  modelTransform.rotationY = 0;
  modelTransform.rotationZ = 0;
  modelTransform.posX = 0;
  modelTransform.posY = 0;
  modelTransform.posZ = 0;

  document.getElementById('model-scale').value = 1;
  document.getElementById('model-scale-value').textContent = '1.0';
  document.getElementById('model-rotate-x').value = 0;
  document.getElementById('model-rotate-x-value').textContent = '0°';
  document.getElementById('model-rotate-y').value = 0;
  document.getElementById('model-rotate-y-value').textContent = '0°';
  document.getElementById('model-rotate-z').value = 0;
  document.getElementById('model-rotate-z-value').textContent = '0°';
  document.getElementById('model-pos-x').value = 0;
  document.getElementById('model-pos-y').value = 0;
  document.getElementById('model-pos-z').value = 0;

  document.getElementById('model-info').innerHTML = `<strong>Name:</strong> Sample Building<br><strong>Type:</strong> BoxGeometry<br><strong>Meshes:</strong> 1`;
  loadedModels = [{name: 'Sample Building', object: currentModel}];
  updateModelList();
}

function updateModelList() {
  const modelsList = document.getElementById('models-list');
  if (loadedModels.length === 0) {
    modelsList.innerHTML = '<div class="no-models">No models loaded</div>';
    return;
  }
  modelsList.innerHTML = loadedModels.map((model, idx) => `
    <div class="model-item">
      <span class="model-item-name">${model.name}</span>
      <button class="model-item-remove" onclick="window.removeModel(${idx})">×</button>
    </div>
  `).join('');
}

window.removeModel = (idx) => {
  scene.remove(loadedModels[idx].object);
  loadedModels.splice(idx, 1);
  updateModelList();
};

function loadModelFromFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const arrayBuffer = event.target.result;
    const blob = new Blob([arrayBuffer]);
    const url = URL.createObjectURL(blob);

    gltfLoader.load(url, (gltf) => {
      if (currentModel) scene.remove(currentModel);

      const model = gltf.scene;
      model.castShadow = true;
      model.receiveShadow = true;

      // Enable shadows for all children
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Calculate bounding box and center model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center in X and Z, but keep Y at ground level
      model.position.x = -center.x;
      model.position.z = -center.z;
      model.position.y = -box.min.y; // Position bottom at Y=0 (ground level)

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 50 / maxDim;
      model.scale.multiplyScalar(scale);

      // Enable transparent material for opacity control
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
        }
      });

      scene.add(model);
      currentModel = model;

      // Store original scale
      originalModelScale.copy(model.scale);

      // Reset transform controls
      modelTransform.scale = 1;
      modelTransform.rotationX = 0;
      modelTransform.rotationY = 0;
      modelTransform.rotationZ = 0;
      modelTransform.posX = 0;
      modelTransform.posY = 0;
      modelTransform.posZ = 0;

      document.getElementById('model-scale').value = 1;
      document.getElementById('model-scale-value').textContent = '1.0';
      document.getElementById('model-rotate-x').value = 0;
      document.getElementById('model-rotate-x-value').textContent = '0°';
      document.getElementById('model-rotate-y').value = 0;
      document.getElementById('model-rotate-y-value').textContent = '0°';
      document.getElementById('model-rotate-z').value = 0;
      document.getElementById('model-rotate-z-value').textContent = '0°';
      document.getElementById('model-pos-x').value = 0;
      document.getElementById('model-pos-y').value = 0;
      document.getElementById('model-pos-z').value = 0;

      // Count meshes
      let meshCount = 0;
      model.traverse((child) => {
        if (child.isMesh) meshCount++;
      });

      document.getElementById('model-info').innerHTML =
        `<strong>Name:</strong> ${file.name}<br>` +
        `<strong>Type:</strong> glTF/glB<br>` +
        `<strong>Meshes:</strong> ${meshCount}<br>` +
        `<strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB`;

      loadedModels = [{name: file.name, object: model}];
      updateModelList();

      // Center camera on model
      const distance = maxDim * 1.5 / Math.tan((75 / 2) * Math.PI / 180);
      camera.position.set(0, size.y / 2, distance);
      camera.lookAt(0, size.y / 2, 0);

      URL.revokeObjectURL(url);
    }, undefined, (error) => {
      alert('Error loading model: ' + error.message);
      console.error('Model loading error:', error);
    });
  };
  reader.readAsArrayBuffer(file);
}

/**
 * Load and render a LAS/LAZ point cloud file
 */
function loadPointCloud(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const arrayBuffer = event.target.result;
      const parsed = parseLAS(arrayBuffer);

      // Create point cloud
      const pointCloud = createPointCloud(parsed, {
        colorMode: 'rgb',
        pointSize: 1,
        opacity: 1,
      });

      // Center and scale point cloud
      const box = new THREE.Box3().setFromObject(pointCloud);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      pointCloud.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 50 / maxDim;
      pointCloud.scale.multiplyScalar(scale);

      scene.add(pointCloud);
      currentModel = pointCloud;

      // Store point cloud metadata
      const bounds = parsed.bounds;
      const pointCount = parsed.pointCount;

      document.getElementById('model-info').innerHTML =
        `<strong>Name:</strong> ${file.name}<br>` +
        `<strong>Type:</strong> Point Cloud (${file.name.endsWith('.laz') ? 'LAZ' : 'LAS'})<br>` +
        `<strong>Points:</strong> ${pointCount.toLocaleString()}<br>` +
        `<strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB<br>` +
        `<strong>Bounds:</strong><br>` +
        `X: ${bounds.min.x.toFixed(2)} - ${bounds.max.x.toFixed(2)}<br>` +
        `Y: ${bounds.min.y.toFixed(2)} - ${bounds.max.y.toFixed(2)}<br>` +
        `Z: ${bounds.min.z.toFixed(2)} - ${bounds.max.z.toFixed(2)}`;

      loadedModels = [{
        name: file.name,
        object: pointCloud,
        type: 'pointcloud',
        data: parsed,
      }];
      updateModelList();

      // Show point cloud controls
      const pcControls = document.getElementById('pointcloud-controls');
      if (pcControls) {
        pcControls.style.display = 'block';
      }

      // Center camera on point cloud
      const distance = maxDim * 1.5 / Math.tan((75 / 2) * Math.PI / 180);
      camera.position.set(0, size.y / 2, distance);
      camera.lookAt(0, size.y / 2, 0);

      console.log('✅ Point cloud loaded:', file.name);
    } catch (error) {
      console.error('Error loading point cloud:', error);
      alert(`Error loading point cloud: ${error.message}`);
    }
  };
  reader.readAsArrayBuffer(file);
}

/**
 * Load and render an IFC BIM model file
 */
function loadIFC(file) {
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const arrayBuffer = event.target.result;
      const parsed = await parseIFC(arrayBuffer);

      // Create IFC model
      const ifcModel = createIFCModel(parsed, {
        colorByType: true,
        defaultOpacity: 1.0,
        scale: 1.0,
      });

      // Remove previous model
      if (currentModel) scene.remove(currentModel);

      // Center and scale IFC model
      const bounds = getIFCModelBounds(ifcModel);
      const center = bounds.center;
      const size = bounds.size;

      ifcModel.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 50 / maxDim;
      ifcModel.scale.multiplyScalar(scale);

      scene.add(ifcModel);
      currentModel = ifcModel;

      // Store IFC metadata
      const productCount = parsed.products ? parsed.products.length : 0;
      const storeyCount = parsed.storeys ? parsed.storeys.length : 0;

      document.getElementById('model-info').innerHTML =
        `<strong>Name:</strong> ${file.name}<br>` +
        `<strong>Type:</strong> IFC (BIM Model)<br>` +
        `<strong>Elements:</strong> ${productCount}<br>` +
        `<strong>Storeys:</strong> ${storeyCount}<br>` +
        `<strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB<br>` +
        `<strong>Bounds:</strong><br>` +
        `X: ${bounds.min.x.toFixed(2)} - ${bounds.max.x.toFixed(2)}<br>` +
        `Y: ${bounds.min.y.toFixed(2)} - ${bounds.max.y.toFixed(2)}<br>` +
        `Z: ${bounds.min.z.toFixed(2)} - ${bounds.max.z.toFixed(2)}`;

      loadedModels = [{
        name: file.name,
        object: ifcModel,
        type: 'ifc',
        data: parsed,
      }];
      updateModelList();

      // Show IFC controls
      const ifcControls = document.getElementById('ifc-controls');
      const pcControls = document.getElementById('pointcloud-controls');
      if (ifcControls) {
        ifcControls.style.display = 'block';
      }
      if (pcControls) {
        pcControls.style.display = 'none';
      }

      // Center camera on IFC model
      const distance = maxDim * 1.5 / Math.tan((75 / 2) * Math.PI / 180);
      camera.position.set(0, size.y / 2, distance);
      camera.lookAt(0, size.y / 2, 0);

      console.log('✅ IFC model loaded:', file.name, {
        elements: productCount,
        storeys: storeyCount,
        buildings: parsed.buildings ? parsed.buildings.length : 0
      });
    } catch (error) {
      console.error('Error loading IFC model:', error);
      alert(`Error loading IFC model: ${error.message}`);
    }
  };
  reader.readAsArrayBuffer(file);
}

/**
 * File input dispatcher - routes to appropriate loader
 */
function loadModel(file) {
  const ext = file.name.toLowerCase().split('.').pop();

  if (ext === 'glb' || ext === 'gltf') {
    loadModelFromFile(file);
    // Hide specialized controls for glTF models
    const pcControls = document.getElementById('pointcloud-controls');
    const ifcControls = document.getElementById('ifc-controls');
    if (pcControls) {
      pcControls.style.display = 'none';
    }
    if (ifcControls) {
      ifcControls.style.display = 'none';
    }
  } else if (ext === 'las' || ext === 'laz') {
    loadPointCloud(file);
  } else if (ext === 'ifc') {
    loadIFC(file);
  } else {
    alert(`Format .${ext} not yet supported. Please use .glb, .gltf, .las, .laz, or .ifc files.`);
  }
}

document.getElementById('load-sample-bim-btn').addEventListener('click', createSampleBuilding);
document.getElementById('bim-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    loadModel(file);
  }
});

// Point Cloud Controls
const pointSizeSlider = document.getElementById('point-size');
const colorModeSelect = document.getElementById('color-mode');

if (pointSizeSlider) {
  pointSizeSlider.addEventListener('input', (e) => {
    const size = parseFloat(e.target.value);
    document.getElementById('point-size-value').textContent = size.toFixed(1);

    if (currentModel && currentModel.isPoints && loadedModels.length > 0) {
      setPointSize(currentModel, size);
    }
  });
}

if (colorModeSelect) {
  colorModeSelect.addEventListener('change', (e) => {
    const mode = e.target.value;

    if (currentModel && currentModel.isPoints && loadedModels.length > 0) {
      const modelData = loadedModels[0];
      if (modelData.data && modelData.data.positions) {
        applyColorMode(
          currentModel,
          modelData.data.positions,
          modelData.data.colors,
          mode,
          modelData.data.bounds
        );
      }
    }
  });
}

// IFC Model Controls
const ifcColorModeSelect = document.getElementById('ifc-color-mode');
const ifcVisibilityCheckboxes = document.querySelectorAll('.ifc-visibility');

if (ifcColorModeSelect) {
  ifcColorModeSelect.addEventListener('change', (e) => {
    const mode = e.target.value;

    if (currentModel && currentModel.isGroup && loadedModels.length > 0) {
      const modelData = loadedModels[0];

      if (mode === 'type') {
        // Color by element type (default - already applied)
        console.log('IFC coloring by type');
      } else if (mode === 'storey') {
        // Apply storey-based color gradient
        const storeyCount = modelData.data && modelData.data.storeys ? modelData.data.storeys.length : 5;
        // applyStoreyColorGradient(currentModel, storeyCount);
        console.log('IFC coloring by storey');
      } else if (mode === 'uniform') {
        // Apply uniform color
        currentModel.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.color.setHex(0xcccccc);
            child.material.needsUpdate = true;
          }
        });
        console.log('IFC coloring uniform');
      }
    }
  });
}

if (ifcVisibilityCheckboxes.length > 0) {
  ifcVisibilityCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const ifcType = e.target.getAttribute('data-type');
      const visible = e.target.checked;

      if (currentModel && currentModel.isGroup && loadedModels.length > 0) {
        setElementTypeVisibility(currentModel, ifcType, visible);
        console.log(`IFC element visibility: ${ifcType} = ${visible}`);
      }
    });
  });
}

document.getElementById('reset-view-btn').addEventListener('click', () => {
  camera.position.set(0, 50, 100);
  camera.lookAt(0, 30, 0);
});

function toggleControlPanel() {
  const panel = document.getElementById('ui-panel');
  const btn = document.getElementById('toggle-panel-btn');
  panel.classList.toggle('collapsed');
  btn.textContent = panel.classList.contains('collapsed') ? 'Show Controls' : 'Hide Controls';
}

document.getElementById('toggle-panel-btn').addEventListener('click', toggleControlPanel);

// Add keyboard shortcut to toggle controls (H key)
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const activeElement = document.activeElement;
    const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
    if (!isInput) {
      e.preventDefault();
      toggleControlPanel();
    }
  }
});

document.getElementById('goto-location-btn').addEventListener('click', async () => {
  // Get coordinates from inputs
  const lat = parseFloat(document.getElementById('latitude').value) || currentLocation.latitude;
  const lon = parseFloat(document.getElementById('longitude').value) || currentLocation.longitude;
  const elev = parseFloat(document.getElementById('elevation').value) || currentLocation.elevation;

  // Update current location
  currentLocation.latitude = lat;
  currentLocation.longitude = lon;
  currentLocation.elevation = elev;

  // Update location info display
  document.getElementById('location-info').textContent = `📍 ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  console.log(`Moving to location: ${lat.toFixed(4)}, ${lon.toFixed(4)} at ${elev}m elevation`);

  // Load new map tiles for this location
  await loadMapTiles(lat, lon, 15);

  // Reset camera view for the new location
  camera.position.set(0, 50, 100);
  camera.lookAt(0, 30, 0);
});

document.getElementById('terrain-layer').addEventListener('change', (e) => {
  ground.visible = e.target.checked;
  gridHelper.visible = e.target.checked;
});

document.getElementById('osm-buildings-layer').addEventListener('change', (e) => {
  // OSM Buildings layer toggle
  if (e.target.checked) {
    console.log('OSM Buildings enabled - showing map tiles');
  } else {
    console.log('OSM Buildings disabled');
  }
});

document.getElementById('imagery-layer').addEventListener('change', async (e) => {
  // Satellite imagery toggle
  if (e.target.checked) {
    // Reload map tiles for current location
    await loadMapTiles(currentLocation.latitude, currentLocation.longitude, 15);
  }
});

document.getElementById('model-opacity').addEventListener('input', (e) => {
  const opacity = parseFloat(e.target.value);
  document.getElementById('model-opacity-value').textContent = opacity.toFixed(1);
  if (currentModel) {
    currentModel.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = opacity;
        child.material.transparent = true; // Always transparent to avoid recompile
      }
    });
  }
});

document.getElementById('close-properties-btn').addEventListener('click', () => {
  document.getElementById('properties-panel').classList.remove('active');
});

const controls = {
  isRotating: false,
  isPanning: false,
  previousMousePosition: { x: 0, y: 0 }
};

renderer.domElement.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    controls.isRotating = true;
  } else if (e.button === 2) {
    controls.isPanning = true;
  }
  controls.previousMousePosition = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('mousemove', (e) => {
  const deltaX = e.clientX - controls.previousMousePosition.x;
  const deltaY = e.clientY - controls.previousMousePosition.y;

  if (controls.isRotating) {
    // Orbital rotation around the camera look-at point
    const relativePos = camera.position.clone().sub(cameraLookAtPoint);
    const radius = relativePos.length();
    const theta = Math.atan2(relativePos.z, relativePos.x) - deltaX * 0.005;
    const phi = Math.acos(relativePos.y / radius) + deltaY * 0.005;
    const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

    camera.position.x = cameraLookAtPoint.x + radius * Math.sin(newPhi) * Math.cos(theta);
    camera.position.y = cameraLookAtPoint.y + radius * Math.cos(newPhi);
    camera.position.z = cameraLookAtPoint.z + radius * Math.sin(newPhi) * Math.sin(theta);
    camera.lookAt(cameraLookAtPoint);
  } else if (controls.isPanning) {
    // 2D pan - move both camera and look-at point together
    const distance = camera.position.distanceTo(cameraLookAtPoint);

    // Calculate pan amount based on distance from target
    const panSpeed = 0.02;
    const panX = deltaX * panSpeed * distance;
    const panY = deltaY * panSpeed * distance;

    // Get camera direction vectors (screen-aligned)
    const cameraDir = cameraLookAtPoint.clone().sub(camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(cameraDir, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3(0, 1, 0); // Keep pan on Y-axis locked

    // Pan both camera and look-at point together
    camera.position.addScaledVector(right, -panX);
    camera.position.addScaledVector(up, panY);
    cameraLookAtPoint.addScaledVector(right, -panX);
    cameraLookAtPoint.addScaledVector(up, panY);

    camera.lookAt(cameraLookAtPoint);
  }

  controls.previousMousePosition = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('mouseup', () => {
  controls.isRotating = false;
  controls.isPanning = false;
});

renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  const direction = new THREE.Vector3().subVectors(camera.position, cameraLookAtPoint).normalize();
  const distance = camera.position.distanceTo(cameraLookAtPoint);
  const newDistance = Math.max(20, Math.min(500, distance + e.deltaY * 0.1));
  camera.position.copy(direction.multiplyScalar(newDistance).add(cameraLookAtPoint));
  camera.lookAt(cameraLookAtPoint);
});

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

// Model transform state
const modelTransform = {
  scale: 1,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  posX: 0,
  posY: 0,
  posZ: 0
};

// Store original scale for each model so we can apply scale multiplicatively
let originalModelScale = new THREE.Vector3(1, 1, 1);

function applyModelTransform() {
  if (!currentModel) return;

  // Apply scale
  currentModel.scale.copy(originalModelScale).multiplyScalar(modelTransform.scale);

  // Apply rotation (in radians)
  currentModel.rotation.order = 'XYZ';
  currentModel.rotation.x = modelTransform.rotationX * Math.PI / 180;
  currentModel.rotation.y = modelTransform.rotationY * Math.PI / 180;
  currentModel.rotation.z = modelTransform.rotationZ * Math.PI / 180;

  // Apply position offset
  currentModel.position.x = modelTransform.posX;
  currentModel.position.y = modelTransform.posY;
  currentModel.position.z = modelTransform.posZ;
}

// Scale slider
document.getElementById('model-scale').addEventListener('input', (e) => {
  modelTransform.scale = parseFloat(e.target.value);
  document.getElementById('model-scale-value').textContent = modelTransform.scale.toFixed(1);
  applyModelTransform();
});

// Rotation X slider
document.getElementById('model-rotate-x').addEventListener('input', (e) => {
  modelTransform.rotationX = parseFloat(e.target.value);
  document.getElementById('model-rotate-x-value').textContent = modelTransform.rotationX.toFixed(0) + '°';
  applyModelTransform();
});

// Rotation Y slider
document.getElementById('model-rotate-y').addEventListener('input', (e) => {
  modelTransform.rotationY = parseFloat(e.target.value);
  document.getElementById('model-rotate-y-value').textContent = modelTransform.rotationY.toFixed(0) + '°';
  applyModelTransform();
});

// Rotation Z slider
document.getElementById('model-rotate-z').addEventListener('input', (e) => {
  modelTransform.rotationZ = parseFloat(e.target.value);
  document.getElementById('model-rotate-z-value').textContent = modelTransform.rotationZ.toFixed(0) + '°';
  applyModelTransform();
});

// Position X input
document.getElementById('model-pos-x').addEventListener('input', (e) => {
  modelTransform.posX = parseFloat(e.target.value) || 0;
  applyModelTransform();
});

// Position Y input
document.getElementById('model-pos-y').addEventListener('input', (e) => {
  modelTransform.posY = parseFloat(e.target.value) || 0;
  applyModelTransform();
});

// Position Z input
document.getElementById('model-pos-z').addEventListener('input', (e) => {
  modelTransform.posZ = parseFloat(e.target.value) || 0;
  applyModelTransform();
});

// Reset transform button
document.getElementById('reset-model-transform-btn').addEventListener('click', () => {
  modelTransform.scale = 1;
  modelTransform.rotationX = 0;
  modelTransform.rotationY = 0;
  modelTransform.rotationZ = 0;
  modelTransform.posX = 0;
  modelTransform.posY = 0;
  modelTransform.posZ = 0;

  document.getElementById('model-scale').value = 1;
  document.getElementById('model-scale-value').textContent = '1.0';
  document.getElementById('model-rotate-x').value = 0;
  document.getElementById('model-rotate-x-value').textContent = '0°';
  document.getElementById('model-rotate-y').value = 0;
  document.getElementById('model-rotate-y-value').textContent = '0°';
  document.getElementById('model-rotate-z').value = 0;
  document.getElementById('model-rotate-z-value').textContent = '0°';
  document.getElementById('model-pos-x').value = 0;
  document.getElementById('model-pos-y').value = 0;
  document.getElementById('model-pos-z').value = 0;

  applyModelTransform();
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

createSampleBuilding();
animate();
