# Supported File Formats - BIM/CAD Viewer

## Quick Reference

| Format | Support Level | Best For | Notes |
|--------|--------------|----------|-------|
| **glTF** | ✅ Full | All BIM/CAD models | Recommended - fastest loading |
| **glB** | ✅ Full | Binary glTF with textures | Recommended - includes materials |
| **RVT** | ✅ Partial | Revit Architecture models | Shows placeholder, export from Revit for full rendering |
| **IFC** | ✅ Partial | Architecture/Construction | Shows placeholder, convert for full rendering |
| **LAS** | ✅ Partial | Point clouds/Survey data | Displays bounding box, convert for full rendering |
| **LAZ** | ✅ Partial | Compressed point clouds | Displays bounding box, convert for full rendering |
| **OBJ** | ⚠️ Limited | Requires MTL | Needs companion MTL file |
| **FBX** | ⚠️ Limited | Revit/3DS Max exports | Requires conversion to glTF |
| **DAE** | ⚠️ Limited | Collada format | Requires conversion to glTF |

## Detailed Format Information

### ✅ Fully Supported Formats

#### glTF (.gltf)
**Best for:** Universal 3D model format with full feature support

Features:
- Full geometry and colors
- Material support (PBR)
- Texture mapping
- Animations
- Metadata

How to use:
1. Export your model as glTF from your CAD software
2. Click "Load BIM/CAD Model" and select the .gltf file
3. Model appears immediately at the specified GPS coordinates

**File size:** Typically smaller than original models

---

#### glB (.glb)
**Best for:** Self-contained models with all assets bundled

Features:
- All glTF features
- Textures embedded in single file
- No external dependencies
- Faster loading

How to use:
1. Export/convert model to glB format
2. Click file input and select the .glb file
3. Complete model loads immediately

**Recommendation:** Use glB over glTF for best performance

---

### ⚠️ Partial Support Formats

#### RVT (.rvt) - Revit Models
**Status:** Placeholder rendering (shows colored box at location)

What it does:
- Reads Revit file header
- Shows placeholder box at model location
- Displays file information in properties panel
- Provides export/conversion workflow guide

**To get full geometry from Revit:**

**Method 1: Direct Export to glTF (RECOMMENDED)**
```
1. Open your Revit file
2. File → Export → glTF
3. Choose export options and save as .glb
4. Upload .glb file to this viewer
✓ Fastest and easiest method
✓ Preserves most geometry and materials
```

**Method 2: Export to IFC, then Convert**
```
1. Open your Revit file
2. File → Export → IFC
3. Visit: https://ifcjs.github.io/web-ifc-viewer/
4. Upload IFC file
5. Download as glTF
6. Upload .glb to this viewer
✓ Good for preserving BIM metadata
```

**Method 3: Export to FBX, then Convert**
```
1. Open your Revit file
2. File → Export → FBX
3. Visit: https://babylonjs-playground.com
4. Load FBX file and export as glB
5. Upload .glb to this viewer
✓ Works for complex models
```

**Method 4: Use Speckle Integration**
```
1. Install Speckle Revit Plugin (free)
2. In Revit, push model to Speckle
3. Go to Speckle web interface
4. Download model as glTF
5. Upload .glb to this viewer
✓ Preserves full BIM data structure
✓ Enables collaboration
```

**Export Settings Tips:**
- Include: Geometry, Materials, Textures
- Exclude: Hidden elements, annotations
- Scale: Use 1:1 for accuracy
- LOD (Level of Detail): Medium or High

**File Size Considerations:**
- Detailed Revit models can be large (50-200MB+)
- Consider exporting specific views or filtered elements
- Use "Selection only" to export partial models
- Optimize textures if needed

---

#### IFC (.ifc)
**Status:** Placeholder rendering (shows colored box at location)

What it does:
- Reads IFC file metadata
- Shows placeholder box at model location
- Displays file information in properties panel
- Provides conversion guide in alert

**To get full geometry:**

Option 1: Online Converter (Easiest)
```
1. Visit: https://ifcjs.github.io/web-ifc-viewer/
2. Upload your IFC file
3. Download converted glTF file
4. Upload glTF file to viewer
```

Option 2: Command Line Tool
```bash
npm install -g if-to-tiles
if-to-tiles input.ifc output.glb
# Then upload output.glb
```

Option 3: Speckle Platform
```
1. Visit: https://speckle.systems/
2. Upload IFC file
3. Export as glTF
4. Download and upload to viewer
```

---

#### LAS (.las) / LAZ (.laz)
**Status:** Bounding box visualization with metadata

What it does:
- Reads point cloud metadata
- Shows bounding box containing all points
- Displays statistics (point count, XYZ ranges)
- Lists file information in properties

**File Info Displayed:**
- Total point count
- Min/Max coordinates (X, Y, Z)
- File name and type

**To visualize point cloud:**

Option 1: Convert to glTF
```
Use online tool: https://viewer.laszip.org/
Or convert to PLY then glTF
```

Option 2: Use Specialized Tools
```bash
# CloudCompare - GUI tool for LAS files
# Open LAS, export as OBJ/glTF
# Upload converted file
```

Option 3: LAS to Mesh
```bash
npm install -g las-to-geojson
# Export as GeoJSON, then convert to glTF
```

---

### ❌ Limited Support (Conversion Required)

#### OBJ (.obj)
**Issue:** Requires companion MTL (material) file

Requirements:
- OBJ file (.obj)
- MTL file (same name, .mtl extension)
- Both files in same directory when uploading

**Better Alternative:** Use glTF/glB instead

Conversion:
```
1. Use Babylon.js Sandbox: https://babylonjs-playground.com
2. Load OBJ + MTL files
3. Export as glB
4. Upload glB to viewer
```

---

#### FBX (.fbx)
**Issue:** Not directly supported by web browsers

**Conversion steps:**

Method 1: Babylon.js Sandbox
```
1. Visit: https://www.babylonjs-playground.com
2. Import FBX file
3. Export as glB
4. Download and upload to viewer
```

Method 2: Online Converter
```
1. Visit: https://convertio.co/fbx-gltf/
2. Upload FBX file
3. Download as glTF/glB
4. Upload to viewer
```

Method 3: Command Line (if you have Python)
```bash
pip install fbx2gltf
fbx2gltf input.fbx output.glb
```

---

#### DAE (Collada) (.dae)
**Issue:** Complex format with varying support

**Conversion:**

Method 1: Online Tool
```
1. Visit: https://convertio.co/dae-gltf/
2. Upload DAE file
3. Download as glTF
4. Upload to viewer
```

Method 2: Babylon.js Sandbox
```
1. Visit: https://babylonjs-playground.com
2. Load DAE file
3. Export as glB
4. Upload to viewer
```

---

## File Format Comparison

### Performance
```
Speed:  glB >> glTF > LAS > IFC
Size:   glB ≈ glTF > LAS > IFC
```

### Feature Support
```
Materials:      glTF/glB ✅ | OBJ ⚠️ | FBX ✅ | Others ❌
Textures:       glTF/glB ✅ | OBJ ⚠️ | FBX ✅ | Others ❌
Animations:     glTF/glB ✅ | FBX ✅ | Others ❌
Metadata:       IFC ✅ | glTF/glB ⚠️ | Others ❌
```

## Preparation Checklist

Before uploading any model:

- [ ] File format is supported (see table above)
- [ ] File size is reasonable (<100MB)
- [ ] Model has valid geometry
- [ ] GPS coordinates are correct (lat/lon/elevation)
- [ ] Materials/textures are embedded (glB) or separate files included
- [ ] File is not corrupted

## Conversion Tools Summary

| Tool | Input | Output | Ease |
|------|-------|--------|------|
| Babylon.js Sandbox | FBX, OBJ, glTF, DAE | glB, OBJ, glTF | Easy |
| Convertio.co | Many formats | glTF, glB, OBJ | Easy |
| CloudCompare | LAS, PLY, OBJ | OBJ, PLY, glTF | Medium |
| if-to-tiles CLI | IFC | glB | Hard |
| Speckle | IFC, many BIM formats | glTF, glB | Easy |

## Best Practices

### For Best Performance
1. **Use glB format** - Fastest loading, all features included
2. **Keep file size under 50MB** - Faster upload and rendering
3. **Use single model file** - Simpler management
4. **Embed textures** - No missing materials

### For BIM Models
1. **Export from Revit/ArchiCAD to glTF** if possible
2. **Clean up geometry** - Remove unused elements
3. **Verify coordinates** before uploading
4. **Test with small model first**

### For Point Clouds
1. **Convert LAS to glTF mesh** for full visualization
2. **Downsample if too large** (millions of points)
3. **Use LAZ for compression** to reduce file size

### For Data Preservation
1. **Keep original IFC files** - Not replaced by conversion
2. **Store metadata separately** - glTF may not preserve all BIM data
3. **Version control models** - Track changes over time

## Troubleshooting

### Model doesn't appear
- Check GPS coordinates (lat: ±90, lon: ±180)
- Verify file format is supported
- Check browser console for errors (F12)
- Try smaller test file first

### File upload fails
- Verify file size < 100MB
- Check file extension is supported
- Ensure file is not corrupted
- Try different browser

### Wrong colors/materials
- Verify glB format used (embeds textures)
- Check textures are included
- Try re-exporting from source software
- Use glB instead of glTF

### Point cloud shows as box
- This is expected for LAS files
- Convert to glTF for full visualization
- Use online tools listed above

## Recommended Workflow

```
1. Start with your CAD model (Revit, SketchUp, etc.)
   ↓
2. Export to glTF format
   OR Convert using online tool
   ↓
3. Verify file is readable (test with viewer)
   ↓
4. Optimize if needed (reduce size, remove unused)
   ↓
5. Upload to BIM/CAD viewer
   ↓
6. Set GPS coordinates
   ↓
7. View with OSM context
```

## Additional Resources

- **Format Specifications:**
  - glTF: https://www.khronos.org/gltf/
  - IFC: https://www.buildingsmart.org/standards/bim-standards/ifc/
  - LAS: https://www.asprs.org/divisions-committees/lidar-division/laser-ids-numbers-for-transmitter-and-receiver-identification/las-specifications

- **Conversion Tools:**
  - Babylon.js: https://babylonjs-playground.com
  - Speckle: https://speckle.systems
  - CloudCompare: https://www.cloudcompare.org

- **Viewing Tools:**
  - glTF Viewer: https://gltf-viewer.donmccurdy.com
  - LAS Viewer: https://viewer.laszip.org
  - IFC Viewer: https://ifcjs.github.io/web-ifc-viewer

## Support

For format-specific questions:
1. Check this guide
2. Try recommended conversion tools
3. Test with sample models
4. Check tool documentation

For viewer issues:
- Check browser console (F12)
- Read README.md for general help
- Review IMPLEMENTATION.md for technical details
