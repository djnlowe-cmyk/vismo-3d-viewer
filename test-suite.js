/**
 * Automated Test Suite for 3D Viewer
 * Validates app structure, configuration, and basic functionality
 */

const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = { passed: 0, failed: 0, errors: [] };
  }

  addTest(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Running Test Suite...\n');
    
    for (const test of this.tests) {
      try {
        await test.fn();
        this.results.passed++;
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.results.failed++;
        this.results.errors.push({ test: test.name, error: error.message });
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error.message}\n`);
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log(`Test Results: ${this.results.passed} passed, ${this.results.failed} failed`);
    console.log('='.repeat(60) + '\n');
    
    if (this.results.failed > 0) {
      process.exit(1);
    }
  }
}

const runner = new TestRunner();
const baseDir = __dirname;

// ========== FILE STRUCTURE TESTS ==========
runner.addTest('Source files exist', () => {
  const files = ['src/index.js', 'src/index.html', 'src/style.css', 'src/config.js'];
  files.forEach(file => {
    if (!fs.existsSync(path.join(baseDir, file))) {
      throw new Error(`Missing ${file}`);
    }
  });
});

runner.addTest('package.json is valid', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(baseDir, 'package.json'), 'utf-8'));
  if (!pkg.name || !pkg.version) throw new Error('Invalid package.json');
  if (!pkg.dependencies.cesium) throw new Error('Missing Cesium dependency');
  if (!pkg.dependencies.three) throw new Error('Missing Three.js dependency');
});

runner.addTest('webpack.config.js is valid', () => {
  const config = require(path.join(baseDir, 'webpack.config.js'));
  if (!config.entry || !config.output) throw new Error('Invalid webpack config');
  if (config.output.path !== path.resolve(baseDir, 'dist')) {
    throw new Error('Webpack output path incorrect');
  }
});

// ========== CODE QUALITY TESTS ==========
runner.addTest('index.html has required elements', () => {
  const html = fs.readFileSync(path.join(baseDir, 'src/index.html'), 'utf-8');
  const required = [
    'id="cesium-container"',
    'id="ui-panel"',
    'id="properties-panel"',
    'id="bim-input"',
    'id="models-list"',
  ];
  required.forEach(element => {
    if (!html.includes(element)) {
      throw new Error(`Missing required element: ${element}`);
    }
  });
});

runner.addTest('index.js has required functions', () => {
  const js = fs.readFileSync(path.join(baseDir, 'src/index.js'), 'utf-8');
  const required = [
    'createSampleBuilding',
    'loadBIMModel',
    'loadGLTFModel',
    'loadLASModel',
    'addModelToList',
    'selectModel',
    'showProperties',
  ];
  required.forEach(fn => {
    if (!js.includes(`function ${fn}`) && !js.includes(`${fn}(`)) {
      throw new Error(`Missing function: ${fn}`);
    }
  });
});

runner.addTest('style.css is not empty', () => {
  const css = fs.readFileSync(path.join(baseDir, 'src/style.css'), 'utf-8');
  if (css.trim().length < 100) {
    throw new Error('CSS file seems incomplete');
  }
});

runner.addTest('config.js exports Config object', () => {
  const config = fs.readFileSync(path.join(baseDir, 'src/config.js'), 'utf-8');
  if (!config.includes('export const Config') && !config.includes('export default Config')) {
    throw new Error('Config not properly exported');
  }
  if (!config.includes('cesium') || !config.includes('models')) {
    throw new Error('Config missing required sections');
  }
});

// ========== BUILD TESTS ==========
runner.addTest('dist/index.html exists after build', () => {
  if (!fs.existsSync(path.join(baseDir, 'dist/index.html'))) {
    throw new Error('Build failed: dist/index.html not found');
  }
});

runner.addTest('dist/main.js exists and has content', () => {
  const mainJs = path.join(baseDir, 'dist/main.js');
  if (!fs.existsSync(mainJs)) {
    throw new Error('Build failed: dist/main.js not found');
  }
  const stats = fs.statSync(mainJs);
  if (stats.size < 1000000) { // Should be > 1MB with Cesium
    throw new Error('dist/main.js seems too small: ' + stats.size + ' bytes');
  }
});

runner.addTest('cesium-static directory exists', () => {
  if (!fs.existsSync(path.join(baseDir, 'dist/cesium-static'))) {
    throw new Error('Build failed: Cesium assets not copied');
  }
});

// ========== CONFIGURATION TESTS ==========
runner.addTest('Cesium Ion token is configured', () => {
  const js = fs.readFileSync(path.join(baseDir, 'src/index.js'), 'utf-8');
  if (!js.includes('Cesium.Ion.defaultAccessToken')) {
    throw new Error('Cesium Ion token not set');
  }
});

runner.addTest('Default location is valid', () => {
  const js = fs.readFileSync(path.join(baseDir, 'src/index.js'), 'utf-8');
  const latMatch = js.match(/latitude['":\s]*[=:]\s*([-\d.]+)/);
  const lonMatch = js.match(/longitude['":\s]*[=:]\s*([-\d.]+)/);
  
  if (!latMatch || !lonMatch) {
    throw new Error('Default coordinates not found');
  }
  
  const lat = parseFloat(latMatch[1]);
  const lon = parseFloat(lonMatch[1]);
  
  if (lat < -90 || lat > 90) throw new Error('Invalid latitude: ' + lat);
  if (lon < -180 || lon > 180) throw new Error('Invalid longitude: ' + lon);
});

// ========== FUNCTIONALITY TESTS ==========
runner.addTest('Event listeners are registered', () => {
  const js = fs.readFileSync(path.join(baseDir, 'src/index.js'), 'utf-8');
  const required = [
    'addEventListener',
    'click',
    'change',
    'LEFT_CLICK',
  ];
  required.forEach(event => {
    if (!js.includes(event)) {
      throw new Error(`Missing event: ${event}`);
    }
  });
});

runner.addTest('Model loading handles multiple formats', () => {
  const js = fs.readFileSync(path.join(baseDir, 'src/index.js'), 'utf-8');
  const formats = ['glb', 'gltf', 'las', 'laz', 'ifc', 'rvt', 'obj', 'fbx', 'dae'];
  formats.forEach(fmt => {
    if (!js.includes(`'${fmt}'`) && !js.includes(`"${fmt}"`)) {
      throw new Error(`Format handler missing: ${fmt}`);
    }
  });
});

runner.addTest('Error handling is implemented', () => {
  const js = fs.readFileSync(path.join(baseDir, 'src/index.js'), 'utf-8');
  if (!js.includes('catch') || !js.includes('try')) {
    throw new Error('Error handling not implemented');
  }
});

// Run all tests
runner.run();
