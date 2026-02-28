/**
 * LAS/LAZ Point Cloud Format Parser
 * Parses LAS (uncompressed) and LAZ (compressed) point cloud files
 * Supports LAS 1.0 - 1.4 formats
 */

import laz from 'laz-perf';

/**
 * Validates LAS file format by checking magic bytes
 * @param {ArrayBuffer} arrayBuffer - The file data
 * @returns {boolean} True if valid LAS file
 */
export function validateLASFile(arrayBuffer) {
  if (arrayBuffer.byteLength < 4) return false;

  const view = new DataView(arrayBuffer);
  // LAS magic bytes: 'LASF' (0x4C 0x41 0x53 0x46)
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );

  return magic === 'LASF';
}

/**
 * Reads a 16-bit unsigned integer from DataView
 * @param {DataView} view - The data view
 * @param {number} offset - Byte offset
 * @param {boolean} littleEndian - Byte order
 * @returns {number}
 */
function readUint16(view, offset, littleEndian = true) {
  return view.getUint16(offset, littleEndian);
}

/**
 * Reads a 32-bit unsigned integer from DataView
 * @param {DataView} view - The data view
 * @param {number} offset - Byte offset
 * @param {boolean} littleEndian - Byte order
 * @returns {number}
 */
function readUint32(view, offset, littleEndian = true) {
  return view.getUint32(offset, littleEndian);
}

/**
 * Reads a 64-bit float (double) from DataView
 * @param {DataView} view - The data view
 * @param {number} offset - Byte offset
 * @param {boolean} littleEndian - Byte order
 * @returns {number}
 */
function readFloat64(view, offset, littleEndian = true) {
  return view.getFloat64(offset, littleEndian);
}

/**
 * Reads a signed 32-bit integer from DataView
 * @param {DataView} view - The data view
 * @param {number} offset - Byte offset
 * @param {boolean} littleEndian - Byte order
 * @returns {number}
 */
function readInt32(view, offset, littleEndian = true) {
  return view.getInt32(offset, littleEndian);
}

/**
 * Reads a signed 16-bit integer from DataView
 * @param {DataView} view - The data view
 * @param {number} offset - Byte offset
 * @param {boolean} littleEndian - Byte order
 * @returns {number}
 */
function readInt16(view, offset, littleEndian = true) {
  return view.getInt16(offset, littleEndian);
}

/**
 * Parse LAS header from buffer
 * LAS header is fixed 227 bytes (required fields)
 * @param {ArrayBuffer} arrayBuffer - The file data
 * @returns {Object} Parsed header information
 */
function parseLASHeader(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const littleEndian = true;

  // Validate file size
  if (arrayBuffer.byteLength < 227) {
    throw new Error('Invalid LAS file: insufficient header size');
  }

  // Magic bytes: 'LASF'
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );

  if (magic !== 'LASF') {
    throw new Error('Invalid LAS file: magic bytes not found');
  }

  // File source ID (2 bytes) at offset 4
  const fileSourceId = readUint16(view, 4, littleEndian);

  // Global encoding (2 bytes) at offset 6
  const globalEncoding = readUint16(view, 6, littleEndian);

  // Version (2 bytes major at 24, 2 bytes minor at 26)
  const versionMajor = readUint8(view, 24);
  const versionMinor = readUint8(view, 25);

  if (versionMajor > 1 || (versionMajor === 1 && versionMinor > 4)) {
    console.warn(`LAS version ${versionMajor}.${versionMinor} may not be fully supported`);
  }

  // System identifier (32 bytes) at offset 26-57
  const systemIdentifier = readString(view, 26, 32).trim();

  // Generating software (32 bytes) at offset 58-89
  const generatingSoftware = readString(view, 58, 32).trim();

  // File creation day of year (2 bytes) at offset 90
  const fileCreationDayOfYear = readUint16(view, 90, littleEndian);

  // File creation year (2 bytes) at offset 92
  const fileCreationYear = readUint16(view, 92, littleEndian);

  // Header size (2 bytes) at offset 94
  const headerSize = readUint16(view, 94, littleEndian);

  // Offset to point data (4 bytes) at offset 96
  const offsetToPointData = readUint32(view, 96, littleEndian);

  // Number of variable length records (4 bytes) at offset 100
  const numberOfVLRs = readUint32(view, 100, littleEndian);

  // Point data format (1 byte) at offset 104
  const pointDataFormat = view.getUint8(104);

  // Point record length (2 bytes) at offset 105
  const pointRecordLength = readUint16(view, 105, littleEndian);

  // Number of point records (4 bytes) at offset 107
  // Note: For LAS 1.4+, use extended values at offset 128+
  let numberOfPoints = readUint32(view, 107, littleEndian);

  // Check if this is LAS 1.4 with extended point count
  if (versionMajor === 1 && versionMinor >= 4 && arrayBuffer.byteLength >= 140) {
    const extendedPointCount = readBigUint64(view, 128, littleEndian);
    if (extendedPointCount > 0) {
      numberOfPoints = Number(extendedPointCount);
    }
  }

  // Scale factors (3 x 8 bytes doubles) at offset 131-154
  const scaleX = readFloat64(view, 131, littleEndian);
  const scaleY = readFloat64(view, 139, littleEndian);
  const scaleZ = readFloat64(view, 147, littleEndian);

  // Offsets (3 x 8 bytes doubles) at offset 155-178
  const offsetX = readFloat64(view, 155, littleEndian);
  const offsetY = readFloat64(view, 163, littleEndian);
  const offsetZ = readFloat64(view, 171, littleEndian);

  return {
    magic,
    fileSourceId,
    globalEncoding,
    versionMajor,
    versionMinor,
    systemIdentifier,
    generatingSoftware,
    fileCreationDayOfYear,
    fileCreationYear,
    headerSize,
    offsetToPointData,
    numberOfVLRs,
    pointDataFormat,
    pointRecordLength,
    numberOfPoints,
    scaleX,
    scaleY,
    scaleZ,
    offsetX,
    offsetY,
    offsetZ,
  };
}

/**
 * Read null-terminated string from DataView
 * @param {DataView} view - The data view
 * @param {number} offset - Byte offset
 * @param {number} maxLength - Maximum length to read
 * @returns {string}
 */
function readString(view, offset, maxLength) {
  const bytes = [];
  for (let i = 0; i < maxLength; i++) {
    const byte = view.getUint8(offset + i);
    if (byte === 0) break;
    bytes.push(String.fromCharCode(byte));
  }
  return bytes.join('');
}

/**
 * Read 8-bit unsigned integer
 * @param {DataView} view - The data view
 * @param {number} offset - Byte offset
 * @returns {number}
 */
function readUint8(view, offset) {
  return view.getUint8(offset);
}

/**
 * Read BigUint64 (for extended point counts in LAS 1.4+)
 * @param {DataView} view - The data view
 * @param {number} offset - Byte offset
 * @param {boolean} littleEndian - Byte order
 * @returns {bigint}
 */
function readBigUint64(view, offset, littleEndian = true) {
  try {
    return view.getBigUint64(offset, littleEndian);
  } catch (e) {
    // Fallback for browsers that don't support getBigUint64
    const low = readUint32(view, offset, littleEndian);
    const high = readUint32(view, offset + 4, littleEndian);
    return BigInt(high) * BigInt(0x100000000) + BigInt(low);
  }
}

/**
 * Parse point records from LAS file
 * Supports formats 0-3 (other formats may have additional fields)
 * @param {ArrayBuffer} arrayBuffer - The file data
 * @param {Object} header - Parsed LAS header
 * @returns {Object} Parsed point data {positions, colors, bounds, colorModel}
 */
function parsePointRecords(arrayBuffer, header) {
  const view = new DataView(arrayBuffer);
  const littleEndian = true;

  const {
    numberOfPoints,
    pointDataFormat,
    pointRecordLength,
    offsetToPointData,
    scaleX,
    scaleY,
    scaleZ,
    offsetX,
    offsetY,
    offsetZ,
  } = header;

  // Allocate arrays for point data
  const positions = new Float32Array(numberOfPoints * 3);
  const colors = new Uint8Array(numberOfPoints * 3);
  let hasRGBData = false;

  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  let minZ = Infinity,
    maxZ = -Infinity;

  // Point record format determines which fields are present
  // Format 0: X, Y, Z, Intensity, Return, Classification, ScanAngle, UserData, PointSourceId
  // Format 1: Format 0 + GPS Time
  // Format 2: Format 0 + RGB
  // Format 3: Format 1 + RGB

  const supportsRGB = pointDataFormat === 2 || pointDataFormat === 3;
  const supportsGPS = pointDataFormat === 1 || pointDataFormat === 3;

  for (let i = 0; i < numberOfPoints; i++) {
    const pointOffset = offsetToPointData + i * pointRecordLength;

    // Read X, Y, Z coordinates (always present, 4 bytes each)
    const rawX = readInt32(view, pointOffset, littleEndian);
    const rawY = readInt32(view, pointOffset + 4, littleEndian);
    const rawZ = readInt32(view, pointOffset + 8, littleEndian);

    // Convert from raw to real coordinates using scale and offset
    const x = rawX * scaleX + offsetX;
    const y = rawY * scaleY + offsetY;
    const z = rawZ * scaleZ + offsetZ;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Update bounds
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);

    // Read RGB data if available (offset 20-21 for formats 2-3)
    if (supportsRGB && pointRecordLength >= 26) {
      const rgbOffset = pointOffset + 20;
      colors[i * 3] = readUint16(view, rgbOffset, littleEndian) >> 8; // Red
      colors[i * 3 + 1] = readUint16(view, rgbOffset + 2, littleEndian) >> 8; // Green
      colors[i * 3 + 2] = readUint16(view, rgbOffset + 4, littleEndian) >> 8; // Blue
      hasRGBData = true;
    } else {
      // Default grayscale from intensity if no RGB
      const intensityOffset = pointOffset + 12;
      const intensity = readUint16(view, intensityOffset, littleEndian) >> 8;
      colors[i * 3] = intensity;
      colors[i * 3 + 1] = intensity;
      colors[i * 3 + 2] = intensity;
    }
  }

  const bounds = {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };

  return {
    positions,
    colors,
    bounds,
    colorModel: hasRGBData ? 'RGB' : 'Intensity',
    hasRGBData,
  };
}

/**
 * Main parser function for LAS/LAZ files
 * @param {ArrayBuffer} arrayBuffer - The file data
 * @returns {Object} Parsed point cloud data
 */
export function parseLAS(arrayBuffer) {
  // Validate file
  if (!validateLASFile(arrayBuffer)) {
    throw new Error('Invalid LAS file format');
  }

  // Check if LAZ (compressed) by examining for LAZ VLRs
  // For now, we assume uncompressed - compression would use laz-perf
  const isLAZ = false; // TODO: Implement LAZ detection and decompression

  if (isLAZ) {
    // TODO: Implement LAZ decompression using laz-perf
    // const decompressed = decompressLAZ(arrayBuffer);
    // arrayBuffer = decompressed;
  }

  // Parse header
  const header = parseLASHeader(arrayBuffer);

  // Parse point records
  const pointData = parsePointRecords(arrayBuffer, header);

  return {
    header,
    pointCount: header.numberOfPoints,
    bounds: pointData.bounds,
    positions: pointData.positions,
    colors: pointData.colors,
    colorModel: pointData.colorModel,
    hasRGBData: pointData.hasRGBData,
  };
}

/**
 * Extract bounds from parsed point data
 * @param {Object} points - Parsed point data
 * @returns {Object} Bounds object
 */
export function extractBounds(points) {
  return points.bounds;
}

/**
 * LAZ decompression using laz-perf
 * @param {ArrayBuffer} arrayBuffer - Compressed LAZ data
 * @returns {ArrayBuffer} Decompressed LAS data
 */
export function decompressLAZ(arrayBuffer) {
  try {
    // Use laz-perf library to decompress
    // This is a placeholder - actual implementation depends on laz-perf API
    const decompressor = new laz.Decompressor();
    const buffer = new Uint8Array(arrayBuffer);
    const decompressed = decompressor.decompress(buffer);
    return decompressed.buffer || decompressed;
  } catch (error) {
    console.error('LAZ decompression error:', error);
    throw new Error(`LAZ decompression failed: ${error.message}`);
  }
}

export default {
  parseLAS,
  validateLASFile,
  extractBounds,
  decompressLAZ,
};
