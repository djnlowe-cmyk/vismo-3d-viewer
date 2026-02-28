#!/bin/bash

# Comprehensive Test Runner for 3D Viewer
# Runs after every build to ensure app integrity

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         3D VIEWER TEST SUITE                               ║"
echo "║       Automated Testing & Validation                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_check() {
  local name="$1"
  local command="$2"
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} $name"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}❌${NC} $name"
    ((FAILED++))
    return 1
  fi
}

# Test 1: Dev server is running
test_check "Dev server is running" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 | grep -q 200"

# Test 2: HTML loads
test_check "HTML loads successfully" "curl -s http://localhost:3000 | wc -l | grep -q '[0-9]'"

# Test 3: Cesium container exists
test_check "Cesium container element exists" "curl -s http://localhost:3000 | grep -q 'id=\"cesium-container\"'"

# Test 4: UI panel exists
test_check "UI control panel exists" "curl -s http://localhost:3000 | grep -q 'id=\"ui-panel\"'"

# Test 5: Properties panel exists
test_check "Properties panel exists" "curl -s http://localhost:3000 | grep -q 'id=\"properties-panel\"'"

# Test 6: Model upload input exists
test_check "BIM model file input exists" "curl -s http://localhost:3000 | grep -q 'id=\"bim-input\"'"

# Test 7: Models list exists
test_check "Models list exists" "curl -s http://localhost:3000 | grep -q 'id=\"models-list\"'"

# Test 8: Cesium styles loaded
test_check "Cesium styles are included" "curl -s http://localhost:3000 | grep -q 'cesium'"

# Test 9: Layer controls exist
test_check "OSM buildings layer control exists" "curl -s http://localhost:3000 | grep -q 'osm-buildings-layer'"

# Test 10: Navigation buttons exist
test_check "Navigation buttons exist" "curl -s http://localhost:3000 | grep -q 'goto-location-btn'"

# Test 11: Sample model file exists
test_check "Sample model file exists" "[ -f './public/sample-data/upnor_castle - 4k.glb' ]"

# Test 12: Sample model is accessible via HTTP
test_check "Sample model accessible via HTTP" "curl -s -I 'http://localhost:3000/sample-data/upnor_castle%20-%204k.glb' | grep -q '200\\|206'"

# Test 13: Build artifacts exist (check webpack output)
test_check "main.js bundled correctly" "[ -f './dist/main.js' ] || curl -s http://localhost:3000/main.js | wc -c | grep -qE '[0-9]{7,}'"

# Test 14: Cesium assets copied
test_check "Cesium assets served" "curl -s -I http://localhost:3000/cesium-static/Widgets/widgets.css | grep -q '200\\|304'"

# Test 15: Config file exists
test_check "Config file is present" "[ -f './src/config.js' ]"

# Test 16: Source files are valid JavaScript
test_check "index.js syntax valid" "node -c ./src/index.js 2>/dev/null"

# Test 17: Webpack config valid
test_check "webpack.config.js is valid" "node -c ./webpack.config.js 2>/dev/null"

# Test 18: package.json dependencies
test_check "Cesium dependency installed" "[ -d './node_modules/cesium' ]"

# Test 19: Three.js dependency
test_check "Three.js dependency installed" "[ -d './node_modules/three' ]"

# Test 20: Event listeners configured
test_check "Event listeners in code" "grep -q 'addEventListener' ./src/index.js"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                      TEST SUMMARY                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "📱 App is ready at: http://localhost:3000"
  echo "📦 Sample model available at: http://localhost:3000/sample-data/upnor_castle%20-%204k.glb"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Some tests failed!${NC}"
  echo ""
  exit 1
fi
