#!/usr/bin/env node

/**
 * Automated Test Runner for 3D Viewer
 * Run with: npm test
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  return new Promise((resolve) => {
    try {
      fn((success) => {
        if (success) {
          console.log(`✅ ${name}`);
          passed++;
        } else {
          console.log(`❌ ${name}`);
          failed++;
        }
        resolve();
      });
    } catch (err) {
      console.log(`❌ ${name} - ${err.message}`);
      failed++;
      resolve();
    }
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         3D VIEWER AUTOMATED TEST SUITE                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Server tests
  await test('Server is running on port 3000', async (done) => {
    try {
      const res = await httpGet('http://localhost:3000');
      done(res.status === 200);
    } catch {
      done(false);
    }
  });

  // HTML structure tests
  await test('HTML contains cesium-container', async (done) => {
    try {
      const res = await httpGet('http://localhost:3000');
      done(res.data.includes('cesium-container') || res.data.includes('viewer-container'));
    } catch {
      done(false);
    }
  });

  await test('HTML contains ui-panel', async (done) => {
    try {
      const res = await httpGet('http://localhost:3000');
      done(res.data.includes('ui-panel'));
    } catch {
      done(false);
    }
  });

  await test('HTML contains properties-panel', async (done) => {
    try {
      const res = await httpGet('http://localhost:3000');
      done(res.data.includes('properties-panel'));
    } catch {
      done(false);
    }
  });

  // Script loading
  await test('main.js is bundled and served', async (done) => {
    try {
      const res = await httpGet('http://localhost:3000/main.js');
      done(res.status === 200 && res.data.length > 500000);
    } catch {
      done(false);
    }
  });

  // Asset tests
  await test('Three.js is bundled', async (done) => {
    try {
      const res = await httpGet('http://localhost:3000/main.js');
      done(res.data.includes('THREE') || res.data.includes('three'));
    } catch {
      done(false);
    }
  });

  // UI element tests
  await test('All required UI controls present', async (done) => {
    try {
      const res = await httpGet('http://localhost:3000');
      const required = [
        'latitude', 'longitude', 'elevation', 'goto-location-btn',
        'osm-buildings-layer', 'terrain-layer', 'imagery-layer',
        'bim-input', 'load-sample-bim-btn', 'models-list',
        'show-properties', 'model-opacity', 'reset-view-btn'
      ];
      const hasAll = required.every(id => res.data.includes(`id="${id}"`));
      done(hasAll);
    } catch {
      done(false);
    }
  });

  // File system tests
  await test('Source files exist', (done) => {
    const files = ['src/index.js', 'src/index.html', 'src/style.css', 'src/config.js'];
    const allExist = files.every(f => fs.existsSync(path.join(__dirname, f)));
    done(allExist);
  });

  await test('Sample model file exists', (done) => {
    const modelPath = path.join(__dirname, 'public/sample-data/upnor_castle - 4k.glb');
    done(fs.existsSync(modelPath));
  });

  await test('Sample model is accessible via HTTP', async (done) => {
    try {
      const res = await httpGet('http://localhost:3000/sample-data/upnor_castle%20-%204k.glb');
      done([200, 206].includes(res.status));
    } catch {
      done(false);
    }
  });

  // Code quality tests
  await test('index.js has glTF model loading', (done) => {
    const content = fs.readFileSync(path.join(__dirname, 'src/index.js'), 'utf-8');
    done((content.includes('function loadGLTFModel') || content.includes('loadModelFromFile')) && content.includes('gltfLoader'));
  });

  await test('index.js has Three.js Scene setup', (done) => {
    const content = fs.readFileSync(path.join(__dirname, 'src/index.js'), 'utf-8');
    done(content.includes('new THREE.Scene()'));
  });

  await test('index.js has GLTFLoader', (done) => {
    const content = fs.readFileSync(path.join(__dirname, 'src/index.js'), 'utf-8');
    done(content.includes('GLTFLoader'));
  });

  await test('Event listeners are registered', (done) => {
    const content = fs.readFileSync(path.join(__dirname, 'src/index.js'), 'utf-8');
    done(content.includes('addEventListener'));
  });

  // IFC Support Tests
  await test('IFC parser module exists', (done) => {
    const parserPath = path.join(__dirname, 'src/loaders/ifc-parser.js');
    done(fs.existsSync(parserPath));
  });

  await test('IFC loader module exists', (done) => {
    const loaderPath = path.join(__dirname, 'src/loaders/ifc-loader.js');
    done(fs.existsSync(loaderPath));
  });

  await test('IFC parser exports parseIFC function', (done) => {
    const content = fs.readFileSync(path.join(__dirname, 'src/loaders/ifc-parser.js'), 'utf-8');
    done(content.includes('export') && content.includes('parseIFC'));
  });

  await test('IFC loader exports createIFCModel function', (done) => {
    const content = fs.readFileSync(path.join(__dirname, 'src/loaders/ifc-loader.js'), 'utf-8');
    done(content.includes('export') && content.includes('createIFCModel'));
  });

  await test('index.js imports IFC modules', (done) => {
    const content = fs.readFileSync(path.join(__dirname, 'src/index.js'), 'utf-8');
    done(content.includes('parseIFC') && content.includes('createIFCModel'));
  });

  await test('index.js has loadIFC function', (done) => {
    const content = fs.readFileSync(path.join(__dirname, 'src/index.js'), 'utf-8');
    done(content.includes('function loadIFC'));
  });

  await test('loadModel dispatcher handles .ifc files', (done) => {
    const content = fs.readFileSync(path.join(__dirname, 'src/index.js'), 'utf-8');
    done(content.includes("ext === 'ifc'") && content.includes('loadIFC(file)'));
  });

  await test('IFC controls section in HTML', async (done) => {
    try {
      const res = await httpGet('http://localhost:3000');
      done(res.data.includes('id="ifc-controls"') && res.data.includes('id="ifc-color-mode"'));
    } catch {
      done(false);
    }
  });

  await test('IFC element visibility checkboxes in HTML', async (done) => {
    try {
      const res = await httpGet('http://localhost:3000');
      done(res.data.includes('class="ifc-visibility"') && res.data.includes('IfcWall'));
    } catch {
      done(false);
    }
  });

  await test('File input accepts .ifc files', async (done) => {
    try {
      const res = await httpGet('http://localhost:3000');
      done(res.data.includes('accept=') && res.data.includes('.ifc'));
    } catch {
      done(false);
    }
  });

  await test('IFC styling in CSS', (done) => {
    const content = fs.readFileSync(path.join(__dirname, 'src/style.css'), 'utf-8');
    done(content.includes('#ifc-controls') && content.includes('#ifc-element-visibility'));
  });

  // Config tests
  await test('Config exports Config object', (done) => {
    const content = fs.readFileSync(path.join(__dirname, 'src/config.js'), 'utf-8');
    done(content.includes('export const Config') || content.includes('export default Config'));
  });

  await test('Webpack config exists and is valid', (done) => {
    try {
      const config = require('./webpack.config.js');
      done(config.entry && config.output && config.plugins);
    } catch {
      done(false);
    }
  });

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST RESULTS                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  if (failed === 0) {
    console.log('✅ All tests passed!\n');
    console.log('📱 App is ready at: http://localhost:3000');
    console.log('📦 Sample model: upnor_castle - 4k.glb (69 MB)\n');
    process.exit(0);
  } else {
    console.log(`❌ ${failed} test(s) failed!\n`);
    process.exit(1);
  }
}

runTests();
