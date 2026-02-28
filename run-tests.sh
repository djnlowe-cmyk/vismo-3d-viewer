#!/bin/bash

echo "=== 3D VIEWER TEST SUITE ==="
echo ""

# Test 1: Server running
echo -n "Test 1: Dev server running... "
if curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 | grep -q 200; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 2: HTML loads
echo -n "Test 2: HTML loads... "
if [ $(curl -s http://localhost:3000 | wc -l) -gt 10 ]; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 3: Cesium container
echo -n "Test 3: Cesium container... "
if curl -s http://localhost:3000 | grep -q 'cesium-container'; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 4: UI panel
echo -n "Test 4: UI panel... "
if curl -s http://localhost:3000 | grep -q 'ui-panel'; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 5: Sample model exists
echo -n "Test 5: Sample model file... "
if [ -f './public/sample-data/upnor_castle - 4k.glb' ]; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 6: Sample model accessible
echo -n "Test 6: Sample model HTTP access... "
if curl -s -I 'http://localhost:3000/sample-data/upnor_castle%20-%204k.glb' | grep -qE '200|206'; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 7: main.js exists
echo -n "Test 7: main.js bundled... "
SIZE=$(curl -s http://localhost:3000/main.js | wc -c)
if [ "$SIZE" -gt 1000000 ]; then
  echo "PASS (${SIZE} bytes)"
else
  echo "FAIL (${SIZE} bytes)"
fi

# Test 8: Cesium assets
echo -n "Test 8: Cesium assets served... "
if curl -s -I http://localhost:3000/cesium-static/Widgets/widgets.css | grep -qE '200|304'; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 9: Event listeners
echo -n "Test 9: Event handlers configured... "
if grep -q 'addEventListener' ./src/index.js; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 10: Cesium dependency
echo -n "Test 10: Cesium installed... "
if [ -d './node_modules/cesium' ]; then
  echo "PASS"
else
  echo "FAIL"
fi

echo ""
echo "=== TEST COMPLETE ==="
echo "App running at: http://localhost:3000"
echo "Sample model: upnor_castle - 4k.glb (69 MB)"
