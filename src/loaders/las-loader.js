/**
 * Three.js Point Cloud Loader
 * Converts parsed LAS point data into Three.js Points geometry
 */

import * as THREE from 'three';

/**
 * Create elevation-based color gradient
 * Maps Z values to colors using a blue-to-red gradient
 * @param {Float32Array} positions - Point positions (x,y,z)
 * @param {number} minElev - Minimum elevation
 * @param {number} maxElev - Maximum elevation
 * @returns {Uint8Array} RGB color data
 */
function createElevationGradient(positions, minElev = null, maxElev = null) {
  const colors = new Uint8Array(positions.length);

  // Find min/max Z if not provided
  let minZ = minElev !== null ? minElev : Infinity;
  let maxZ = maxElev !== null ? maxElev : -Infinity;

  if (minElev === null || maxElev === null) {
    for (let i = 2; i < positions.length; i += 3) {
      minZ = Math.min(minZ, positions[i]);
      maxZ = Math.max(maxZ, positions[i]);
    }
  }

  const range = maxZ - minZ || 1;

  // Create color gradient from blue (low) to red (high)
  for (let i = 0; i < positions.length; i += 3) {
    const z = positions[i + 2];
    const normalized = (z - minZ) / range; // 0-1
    const hue = (1 - normalized) * 240; // Blue (240°) to Red (0°) in HSL

    // Convert HSL to RGB
    const rgb = hslToRgb(hue, 100, 50);
    colors[i] = rgb.r;
    colors[i + 1] = rgb.g;
    colors[i + 2] = rgb.b;
  }

  return colors;
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {Object} RGB values {r, g, b}
 */
function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Create intensity-based grayscale colors
 * @param {Uint8Array} intensityData - Intensity values (0-255)
 * @returns {Uint8Array} RGB color data
 */
function createIntensityMap(intensityData) {
  const colors = new Uint8Array(intensityData.length * 3);

  for (let i = 0; i < intensityData.length; i++) {
    const intensity = intensityData[i];
    colors[i * 3] = intensity;
    colors[i * 3 + 1] = intensity;
    colors[i * 3 + 2] = intensity;
  }

  return colors;
}

/**
 * Create Three.js BufferGeometry from parsed point data
 * @param {Object} parsedData - Result from parseLAS()
 * @param {string} colorMode - 'rgb', 'elevation', or 'intensity'
 * @returns {THREE.BufferGeometry} Configured geometry
 */
export function createPointCloudGeometry(parsedData, colorMode = 'rgb') {
  const { positions, colors, bounds, hasRGBData } = parsedData;

  const geometry = new THREE.BufferGeometry();

  // Add position attribute
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Add colors based on color mode
  let colorData = colors;

  if (!hasRGBData || colorMode === 'elevation') {
    // Use elevation gradient
    colorData = createElevationGradient(
      positions,
      bounds.min.z,
      bounds.max.z
    );
  } else if (colorMode === 'intensity') {
    // Use intensity map
    colorData = createIntensityMap(colors);
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colorData, 3, true));

  // Compute bounds for frustum culling
  geometry.computeBoundingBox();

  return geometry;
}

/**
 * Create Three.js PointsMaterial for point cloud rendering
 * @param {Object} options - Configuration options
 * @returns {THREE.PointsMaterial}
 */
export function createPointsMaterial(options = {}) {
  const {
    size = 1,
    sizeAttenuation = true,
    vertexColors = true,
    transparent = false,
    opacity = 1,
  } = options;

  const material = new THREE.PointsMaterial({
    size,
    sizeAttenuation,
    vertexColors,
    transparent,
    opacity,
  });

  return material;
}

/**
 * Create Three.js Points object from geometry and material
 * @param {THREE.BufferGeometry} geometry - Point cloud geometry
 * @param {THREE.PointsMaterial} material - Point material
 * @returns {THREE.Points} Point cloud object
 */
export function createPointsObject(geometry, material) {
  const points = new THREE.Points(geometry, material);
  return points;
}

/**
 * Get bounding box and size of a points object
 * @param {THREE.Points} points - Point cloud object
 * @returns {Object} {center, size, radius}
 */
export function getPointCloudBounds(points) {
  const box = new THREE.Box3().setFromObject(points);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = size.length() / 2;

  return {
    center,
    size,
    radius,
    min: box.min,
    max: box.max,
  };
}

/**
 * Apply color mode to existing point cloud
 * @param {THREE.Points} points - Point cloud object
 * @param {Float32Array} positions - Original positions
 * @param {Uint8Array} originalColors - Original color data
 * @param {string} mode - 'rgb', 'elevation', or 'intensity'
 * @param {Object} bounds - Bounds object {min, max}
 */
export function applyColorMode(points, positions, originalColors, mode, bounds) {
  const geometry = points.geometry;
  let colorData;

  switch (mode) {
    case 'elevation':
      colorData = createElevationGradient(positions, bounds.min.z, bounds.max.z);
      break;
    case 'intensity':
      colorData = createIntensityMap(originalColors);
      break;
    case 'rgb':
    default:
      colorData = originalColors;
      break;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colorData, 3, true));
  points.material.vertexColors = true;
  points.material.needsUpdate = true;
}

/**
 * Set point size with optional limits
 * @param {THREE.Points} points - Point cloud object
 * @param {number} size - Point size
 * @param {number} minSize - Minimum point size (optional)
 * @param {number} maxSize - Maximum point size (optional)
 */
export function setPointSize(points, size, minSize = 0.1, maxSize = 50) {
  const clampedSize = Math.max(minSize, Math.min(size, maxSize));
  points.material.size = clampedSize;
  points.material.needsUpdate = true;
}

/**
 * Set point cloud opacity
 * @param {THREE.Points} points - Point cloud object
 * @param {number} opacity - Opacity value (0-1)
 */
export function setPointOpacity(points, opacity) {
  const clampedOpacity = Math.max(0, Math.min(opacity, 1));
  points.material.opacity = clampedOpacity;

  if (clampedOpacity < 1) {
    points.material.transparent = true;
  }

  points.material.needsUpdate = true;
}

/**
 * Create a complete point cloud from LAS parsed data
 * @param {Object} parsedData - Result from parseLAS()
 * @param {Object} options - Rendering options
 * @returns {THREE.Points} Configured point cloud
 */
export function createPointCloud(parsedData, options = {}) {
  const {
    colorMode = 'rgb',
    pointSize = 1,
    opacity = 1,
  } = options;

  const geometry = createPointCloudGeometry(parsedData, colorMode);
  const material = createPointsMaterial({
    size: pointSize,
    opacity,
    vertexColors: true,
  });

  const points = createPointsObject(geometry, material);

  return points;
}

export default {
  createPointCloud,
  createPointCloudGeometry,
  createPointsMaterial,
  createPointsObject,
  getPointCloudBounds,
  applyColorMode,
  setPointSize,
  setPointOpacity,
};
