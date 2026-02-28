/**
 * IFC to Three.js Loader
 * Converts parsed IFC BIM data into Three.js geometries and meshes
 * Uses placeholder geometry for complex IFC representations
 */

import * as THREE from 'three';
import { getEntityColor, IFC_TYPES } from './ifc-parser.js';

/**
 * Create a Three.js Group containing all IFC elements
 * @param {Object} parsedData - Result from parseIFC()
 * @param {Object} options - Configuration options
 * @returns {THREE.Group} Container group with all IFC meshes
 */
export function createIFCModel(parsedData, options = {}) {
  const {
    colorByType = true,
    defaultOpacity = 1.0,
    scale = 1.0,
  } = options;

  const group = new THREE.Group();
  group.isGroup = true;

  // Add meshes for all products
  for (const product of parsedData.products) {
    try {
      const mesh = createProductMesh(product, {
        colorByType,
        defaultOpacity,
      });

      if (mesh) {
        group.add(mesh);
      }
    } catch (error) {
      console.warn(`Failed to create mesh for product ${product.id}:`, error);
    }
  }

  // Auto-center and scale the model
  centerAndScaleModel(group, 50);

  return group;
}

/**
 * Create a mesh for a single IFC product
 */
function createProductMesh(product, options) {
  const { colorByType = true, defaultOpacity = 1.0 } = options;

  try {
    // Create geometry based on entity type
    let geometry;
    switch (product.type) {
      case IFC_TYPES.WALL:
        geometry = createWallGeometry();
        break;
      case IFC_TYPES.DOOR:
        geometry = createDoorGeometry();
        break;
      case IFC_TYPES.WINDOW:
        geometry = createWindowGeometry();
        break;
      case IFC_TYPES.SLAB:
        geometry = createSlabGeometry();
        break;
      case IFC_TYPES.COLUMN:
        geometry = createColumnGeometry();
        break;
      case IFC_TYPES.BEAM:
        geometry = createBeamGeometry();
        break;
      case IFC_TYPES.STAIR:
        geometry = createStairGeometry();
        break;
      case IFC_TYPES.ROOF:
        geometry = createRoofGeometry();
        break;
      case IFC_TYPES.FURNITURE:
        geometry = createFurnitureGeometry();
        break;
      default:
        geometry = createDefaultGeometry();
    }

    // Create material
    const color = colorByType ? product.color : { r: 200, g: 200, b: 200 };
    const material = createMaterialForType(product.type, color, defaultOpacity);

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      ifcType: product.type,
      ifcId: product.id,
      name: product.name,
      properties: product.properties,
    };

    // Random position for visual distribution
    const offset = Math.random() * 20 - 10;
    mesh.position.x = offset;
    mesh.position.z = Math.random() * 20 - 10;

    return mesh;
  } catch (error) {
    console.warn(`Error creating mesh for ${product.type}:`, error);
    return null;
  }
}

/**
 * Create geometry for wall elements
 */
function createWallGeometry() {
  // Wall: thin box
  return new THREE.BoxGeometry(5, 3, 0.3);
}

/**
 * Create geometry for door elements
 */
function createDoorGeometry() {
  // Door: tall thin rectangle
  return new THREE.BoxGeometry(1.0, 2.5, 0.05);
}

/**
 * Create geometry for window elements
 */
function createWindowGeometry() {
  // Window: transparent plane
  const geometry = new THREE.PlaneGeometry(1.2, 1.2);
  return geometry;
}

/**
 * Create geometry for slab (floor/ceiling) elements
 */
function createSlabGeometry() {
  // Slab: thin horizontal box
  return new THREE.BoxGeometry(8, 0.3, 8);
}

/**
 * Create geometry for column elements
 */
function createColumnGeometry() {
  // Column: cylinder (vertical element)
  return new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
}

/**
 * Create geometry for beam elements
 */
function createBeamGeometry() {
  // Beam: elongated box
  return new THREE.BoxGeometry(0.4, 0.4, 6);
}

/**
 * Create geometry for stair elements
 */
function createStairGeometry() {
  // Stair: stepped structure (simplified as box)
  return new THREE.BoxGeometry(1.5, 3, 2);
}

/**
 * Create geometry for roof elements
 */
function createRoofGeometry() {
  // Roof: angled structure (simplified as pyramid)
  const geometry = new THREE.ConeGeometry(5, 2, 8);
  return geometry;
}

/**
 * Create geometry for furniture elements
 */
function createFurnitureGeometry() {
  // Furniture: small box
  return new THREE.BoxGeometry(1.5, 1.5, 1.5);
}

/**
 * Create default geometry for unknown types
 */
function createDefaultGeometry() {
  // Default: small box
  return new THREE.BoxGeometry(1, 1, 1);
}

/**
 * Create material for IFC entity type
 */
function createMaterialForType(ifcType, color, opacity = 1.0) {
  const rgbColor = new THREE.Color(
    color.r / 255,
    color.g / 255,
    color.b / 255
  );

  // Use transparent material for windows
  const isTransparent = ifcType === IFC_TYPES.WINDOW;

  const material = new THREE.MeshPhongMaterial({
    color: rgbColor,
    emissive: 0x0,
    shininess: 30,
    side: THREE.DoubleSide,
    transparent: isTransparent,
    opacity: isTransparent ? 0.5 : opacity,
    wireframe: false,
  });

  return material;
}

/**
 * Center and scale IFC model to fit viewport
 */
function centerAndScaleModel(group, targetSize = 50) {
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Center the model
  group.position.copy(center.multiplyScalar(-1));

  // Scale to fit target size
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const scale = targetSize / maxDim;
    group.scale.multiplyScalar(scale);
  }
}

/**
 * Get bounding box information for IFC model
 */
export function getIFCModelBounds(group) {
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = size.length() / 2;

  return {
    center,
    size,
    radius,
    min: box.min.clone(),
    max: box.max.clone(),
  };
}

/**
 * Set visibility for elements of a specific type
 */
export function setElementTypeVisibility(group, ifcType, visible) {
  group.traverse((child) => {
    if (child.userData && child.userData.ifcType === ifcType) {
      child.visible = visible;
    }
  });
}

/**
 * Change color for elements of a specific type
 */
export function setElementTypeColor(group, ifcType, color) {
  const rgbColor = new THREE.Color(
    color.r / 255,
    color.g / 255,
    color.b / 255
  );

  group.traverse((child) => {
    if (
      child.userData &&
      child.userData.ifcType === ifcType &&
      child.material
    ) {
      child.material.color.copy(rgbColor);
      child.material.needsUpdate = true;
    }
  });
}

/**
 * Apply opacity to entire model
 */
export function setIFCModelOpacity(group, opacity) {
  const clampedOpacity = Math.max(0, Math.min(opacity, 1));

  group.traverse((child) => {
    if (child.material) {
      child.material.opacity = clampedOpacity;
      child.material.transparent = clampedOpacity < 1;
      child.material.needsUpdate = true;
    }
  });
}

/**
 * Highlight a specific element
 */
export function highlightIFCElement(group, ifcId, highlight = true) {
  group.traverse((child) => {
    if (child.userData && child.userData.ifcId === ifcId) {
      if (highlight) {
        // Store original color
        if (!child.userData.originalEmissive) {
          child.userData.originalEmissive = child.material.emissive.getHex();
        }
        // Set highlight color
        child.material.emissive.setHex(0x00ff00);
      } else {
        // Restore original color
        if (child.userData.originalEmissive) {
          child.material.emissive.setHex(child.userData.originalEmissive);
        }
      }
      child.material.needsUpdate = true;
    }
  });
}

/**
 * Get all elements of a specific type
 */
export function getIFCElementsByType(group, ifcType) {
  const elements = [];

  group.traverse((child) => {
    if (child.userData && child.userData.ifcType === ifcType) {
      elements.push(child);
    }
  });

  return elements;
}

/**
 * Apply color gradient by storey level
 */
export function applyStoreyColorGradient(group, numStoreys = 5) {
  const hues = [];
  for (let i = 0; i < numStoreys; i++) {
    hues.push(i / numStoreys);
  }

  let storeyIndex = 0;
  group.traverse((child) => {
    if (child.material && storeyIndex < hues.length) {
      const color = new THREE.Color().setHSL(hues[storeyIndex], 1, 0.5);
      child.material.color.copy(color);
      child.material.needsUpdate = true;
      storeyIndex = (storeyIndex + 1) % numStoreys;
    }
  });
}

export default {
  createIFCModel,
  getIFCModelBounds,
  setElementTypeVisibility,
  setElementTypeColor,
  setIFCModelOpacity,
  highlightIFCElement,
  getIFCElementsByType,
  applyStoreyColorGradient,
};
