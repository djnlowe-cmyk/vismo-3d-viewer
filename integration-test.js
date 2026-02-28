/**
 * Integration Test Suite - Tests the running dev server
 */

const http = require('http');

function testServer(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('\n🧪 Running Integration Tests\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Server responds
  try {
    const response = await testServer('http://localhost:3000/');
    if (response.status === 200) {
      console.log('✅ Server responds with 200');
      passed++;
    } else {
      console.log(`❌ Server returned ${response.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ Server not responding: ${err.message}`);
    failed++;
  }

  // Test 2: HTML contains Cesium container
  try {
    const response = await testServer('http://localhost:3000/');
    if (response.data.includes('id="cesium-container"')) {
      console.log('✅ HTML contains cesium-container');
      passed++;
    } else {
      console.log('❌ HTML missing cesium-container');
      failed++;
    }
  } catch (err) {
    console.log(`❌ Failed to check HTML: ${err.message}`);
    failed++;
  }

  // Test 3: HTML contains UI panel
  try {
    const response = await testServer('http://localhost:3000/');
    if (response.data.includes('id="ui-panel"')) {
      console.log('✅ HTML contains ui-panel');
      passed++;
    } else {
      console.log('❌ HTML missing ui-panel');
      failed++;
    }
  } catch (err) {
    console.log(`❌ Failed to check ui-panel: ${err.message}`);
    failed++;
  }

  // Test 4: main.js is loaded
  try {
    const response = await testServer('http://localhost:3000/');
    if (response.data.includes('src="./main.js"') || response.data.includes('src=\\"./main.js\\"')) {
      console.log('✅ HTML loads main.js script');
      passed++;
    } else {
      console.log('❌ HTML does not load main.js');
      failed++;
    }
  } catch (err) {
    console.log(`❌ Failed to check script: ${err.message}`);
    failed++;
  }

  // Test 5: Cesium styles are included
  try {
    const response = await testServer('http://localhost:3000/');
    if (response.data.includes('cesium') && response.data.includes('widgets.css')) {
      console.log('✅ Cesium styles included');
      passed++;
    } else {
      console.log('❌ Cesium styles missing');
      failed++;
    }
  } catch (err) {
    console.log(`❌ Failed to check styles: ${err.message}`);
    failed++;
  }

  // Test 6: All required UI elements present
  try {
    const response = await testServer('http://localhost:3000/');
    const required = [
      'id="latitude"',
      'id="longitude"',
      'id="elevation"',
      'id="goto-location-btn"',
      'id="bim-input"',
      'id="models-list"',
      'id="osm-buildings-layer"',
      'id="properties-panel"'
    ];
    
    let allPresent = true;
    const missing = [];
    
    required.forEach(elem => {
      if (!response.data.includes(elem)) {
        allPresent = false;
        missing.push(elem);
      }
    });
    
    if (allPresent) {
      console.log('✅ All required UI elements present');
      passed++;
    } else {
      console.log(`❌ Missing UI elements: ${missing.join(', ')}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ Failed to check UI: ${err.message}`);
    failed++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
