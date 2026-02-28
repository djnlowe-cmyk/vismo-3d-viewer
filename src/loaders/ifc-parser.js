/**
 * IFC (Industry Foundation Classes) File Parser
 * Parses IFC STEP format BIM files and extracts geometric entities
 * Uses web-ifc library for format parsing and entity extraction
 */

import * as WebIFC from 'web-ifc';

// Web-IFC API instance (initialized lazily)
let ifcAPI = null;

/**
 * Initialize the web-ifc API
 * Must be called before parsing IFC files
 */
async function initializeIFCAPI() {
  if (ifcAPI) return ifcAPI;

  ifcAPI = new WebIFC.IfcAPI();

  // Set WASM path - use CDN for broad compatibility
  try {
    await ifcAPI.SetWasmPath('https://cdn.jsdelivr.net/npm/web-ifc@0.0.75/');
  } catch (error) {
    console.warn('Failed to load WASM from CDN, using fallback path:', error);
    // Fallback to local path if CDN fails
    await ifcAPI.SetWasmPath('./wasm/');
  }

  return ifcAPI;
}

/**
 * Validate IFC file format by checking magic bytes
 * IFC files start with: ISO-10303-21
 * @param {ArrayBuffer} arrayBuffer - The file data
 * @returns {boolean} True if valid IFC file
 */
export function validateIFCFile(arrayBuffer) {
  if (arrayBuffer.byteLength < 20) return false;

  const view = new Uint8Array(arrayBuffer);
  const text = String.fromCharCode(...view.slice(0, 13));

  // Check for STEP format magic bytes
  return text === 'ISO-10303-21';
}

/**
 * IFC Entity Type Constants
 */
export const IFC_TYPES = {
  WALL: 'IfcWall',
  DOOR: 'IfcDoor',
  WINDOW: 'IfcWindow',
  SLAB: 'IfcSlab',
  BEAM: 'IfcBeam',
  COLUMN: 'IfcColumn',
  STAIR: 'IfcStair',
  RAMP: 'IfcRamp',
  BUILDING: 'IfcBuilding',
  STOREY: 'IfcBuildingStorey',
  SPACE: 'IfcSpace',
  FURNITURE: 'IfcFurniture',
  ROOF: 'IfcRoof',
  CHIMNEY: 'IfcChimney',
};

/**
 * Color mapping for different IFC entity types
 */
export const IFC_COLOR_MAP = {
  'IfcWall': { r: 136, g: 136, b: 136 },     // Gray
  'IfcDoor': { r: 255, g: 107, b: 0 },       // Orange
  'IfcWindow': { r: 135, g: 206, b: 235 },   // Sky blue
  'IfcSlab': { r: 139, g: 115, b: 85 },      // Brown
  'IfcBeam': { r: 160, g: 82, b: 45 },       // Saddle brown
  'IfcColumn': { r: 105, g: 105, b: 105 },   // Dim gray
  'IfcStair': { r: 169, g: 169, b: 169 },    // Light gray
  'IfcRamp': { r: 176, g: 176, b: 176 },     // Gray
  'IfcRoof': { r: 100, g: 64, b: 10 },       // Dark brown
  'IfcChimney': { r: 128, g: 128, b: 128 },  // Gray
  'IfcFurniture': { r: 200, g: 150, b: 100 }, // Light brown
  'default': { r: 204, g: 204, b: 204 },     // Light gray
};

/**
 * Get color for a specific IFC entity type
 * @param {string} ifcType - IFC entity type string
 * @returns {Object} Color object {r, g, b}
 */
export function getEntityColor(ifcType) {
  return IFC_COLOR_MAP[ifcType] || IFC_COLOR_MAP['default'];
}

/**
 * Convert RGB color to hex string
 * @param {Object} color - Color object {r, g, b}
 * @returns {string} Hex color string (#RRGGBB)
 */
export function colorToHex(color) {
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

/**
 * Main IFC parser function
 * Parses IFC file and extracts building structure and products
 * @param {ArrayBuffer} arrayBuffer - The IFC file data
 * @param {Object} options - Optional parsing options
 * @returns {Promise<Object>} Parsed IFC data structure
 */
export async function parseIFC(arrayBuffer, options = {}) {
  // Validate file format
  if (!validateIFCFile(arrayBuffer)) {
    throw new Error('Invalid IFC file format - magic bytes not found');
  }

  // Initialize web-ifc API
  const api = await initializeIFCAPI();

  try {
    // Open model from buffer
    const modelID = await api.OpenModel(new Uint8Array(arrayBuffer), {
      COORDINATE_TO_ORIGIN: true,
      OPTIMIZE_PROFILES: true
    });

    console.log('IFC model loaded with ID:', modelID);

    // Extract building structure
    const buildings = await extractBuildings(api, modelID);
    const storeys = await extractStoreys(api, modelID);
    const spaces = await extractSpaces(api, modelID);
    const products = await extractProducts(api, modelID);

    // Calculate bounds
    const bounds = calculateBounds(products);

    // Extract metadata
    const metadata = {
      version: '1.0', // Default to IFC 1.0
      schema: await extractSchemaVersion(api, modelID),
      entityCount: products.length + buildings.length + storeys.length + spaces.length,
    };

    return {
      buildings,
      storeys,
      spaces,
      products,
      bounds,
      metadata,
      modelID, // Store for future access
    };
  } catch (error) {
    console.error('IFC parsing error:', error);
    throw new Error(`Failed to parse IFC file: ${error.message}`);
  }
}

/**
 * Extract building entities from IFC model
 */
async function extractBuildings(api, modelID) {
  const buildings = [];

  try {
    // Query all IfcBuilding entities
    const buildingIDs = await api.GetLineIDsWithType(modelID, WebIFC.IFCBUILDING);

    for (const id of buildingIDs) {
      try {
        const properties = await api.GetProperties(modelID, id, true);
        buildings.push({
          id,
          name: properties?.Name?.value || `Building_${id}`,
          type: 'IfcBuilding',
          properties: properties || {},
        });
      } catch (e) {
        console.warn(`Failed to extract building ${id}:`, e);
      }
    }
  } catch (error) {
    console.warn('Error extracting buildings:', error);
  }

  return buildings;
}

/**
 * Extract storey (level) entities from IFC model
 */
async function extractStoreys(api, modelID) {
  const storeys = [];

  try {
    // Query all IfcBuildingStorey entities
    const storeyIDs = await api.GetLineIDsWithType(modelID, WebIFC.IFCBUILDINGSTOREY);

    for (const id of storeyIDs) {
      try {
        const properties = await api.GetProperties(modelID, id, true);
        storeys.push({
          id,
          name: properties?.Name?.value || `Storey_${id}`,
          type: 'IfcBuildingStorey',
          properties: properties || {},
        });
      } catch (e) {
        console.warn(`Failed to extract storey ${id}:`, e);
      }
    }
  } catch (error) {
    console.warn('Error extracting storeys:', error);
  }

  return storeys;
}

/**
 * Extract space entities from IFC model
 */
async function extractSpaces(api, modelID) {
  const spaces = [];

  try {
    // Query all IfcSpace entities
    const spaceIDs = await api.GetLineIDsWithType(modelID, WebIFC.IFCSPACE);

    for (const id of spaceIDs) {
      try {
        const properties = await api.GetProperties(modelID, id, true);
        spaces.push({
          id,
          name: properties?.Name?.value || `Space_${id}`,
          type: 'IfcSpace',
          properties: properties || {},
        });
      } catch (e) {
        console.warn(`Failed to extract space ${id}:`, e);
      }
    }
  } catch (error) {
    console.warn('Error extracting spaces:', error);
  }

  return spaces;
}

/**
 * Extract physical product entities (walls, doors, windows, etc.)
 */
async function extractProducts(api, modelID) {
  const products = [];

  // Product types to extract
  const productTypes = [
    { type: WebIFC.IFCWALL, name: 'IfcWall' },
    { type: WebIFC.IFCDOOR, name: 'IfcDoor' },
    { type: WebIFC.IFCWINDOW, name: 'IfcWindow' },
    { type: WebIFC.IFCBEAM, name: 'IfcBeam' },
    { type: WebIFC.IFCCOLUMN, name: 'IfcColumn' },
    { type: WebIFC.IFCSTAIR, name: 'IfcStair' },
    { type: WebIFC.IFCRAMP, name: 'IfcRamp' },
    { type: WebIFC.IFCROOF, name: 'IfcRoof' },
    { type: WebIFC.IFCSLAB, name: 'IfcSlab' },
    { type: WebIFC.IFCFURNITURE, name: 'IfcFurniture' },
  ];

  for (const { type, name } of productTypes) {
    try {
      const productIDs = await api.GetLineIDsWithType(modelID, type);

      for (const id of productIDs) {
        try {
          const properties = await api.GetProperties(modelID, id, true);
          const color = getEntityColor(name);

          products.push({
            id,
            name: properties?.Name?.value || `${name}_${id}`,
            type: name,
            properties: properties || {},
            color: color,
          });
        } catch (e) {
          console.warn(`Failed to extract product ${id}:`, e);
        }
      }
    } catch (error) {
      console.warn(`Error extracting ${name} entities:`, error);
    }
  }

  return products;
}

/**
 * Extract IFC schema version information
 */
async function extractSchemaVersion(api, modelID) {
  try {
    // Try to get file info
    const fileInfo = api.GetModelMetaData?.(modelID);
    if (fileInfo) {
      return fileInfo.schema || 'Unknown';
    }
  } catch (e) {
    console.warn('Failed to extract schema version:', e);
  }

  return 'IFC 2.3 / 4.x';
}

/**
 * Calculate 3D bounds from product entities
 * Creates a simple bounding box estimation
 */
function calculateBounds(products) {
  if (products.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 10, y: 10, z: 10 },
    };
  }

  // Simple bounds: estimate from product count and spacing
  // In a real implementation, you'd extract actual geometry
  const spacing = 5; // Assume 5m spacing between products
  const gridSize = Math.ceil(Math.sqrt(products.length));

  return {
    min: { x: 0, y: 0, z: 0 },
    max: {
      x: gridSize * spacing,
      y: 10, // Assume 10m height
      z: gridSize * spacing,
    },
  };
}

/**
 * Extract detailed properties for a specific entity
 */
export async function extractEntityProperties(api, modelID, entityID) {
  try {
    const properties = await api.GetProperties(modelID, entityID, true);
    return properties || {};
  } catch (error) {
    console.warn(`Failed to extract properties for entity ${entityID}:`, error);
    return {};
  }
}

/**
 * Close IFC model and cleanup resources
 */
export function closeIFCModel(modelID) {
  if (ifcAPI && modelID) {
    try {
      ifcAPI.CloseModel?.(modelID);
    } catch (e) {
      console.warn('Failed to close IFC model:', e);
    }
  }
}

export default {
  parseIFC,
  validateIFCFile,
  getEntityColor,
  colorToHex,
  IFC_TYPES,
  IFC_COLOR_MAP,
  extractEntityProperties,
  closeIFCModel,
};
