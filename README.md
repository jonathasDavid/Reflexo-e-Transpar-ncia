# WebGL Reflection and Transparency Application

A WebGL2 application demonstrating dynamic reflection and transparency effects using custom shaders, framebuffers, and clipping planes.

## Features

- ✅ Custom vertex and fragment shaders
- ✅ Dynamic reflection using framebuffers (not cube maps)
- ✅ Multi-pass rendering (reflection pass + main scene pass)
- ✅ Adjustable transparency with Fresnel effect
- ✅ Textures on all objects including glass plane
- ✅ Clipping plane implementation
- ✅ Flyby camera with keyboard and mouse controls
- ✅ At least 2 objects (cube and sphere) with glass plane dividing them

## Requirements

- Modern web browser with WebGL2 support (Chrome, Firefox, Edge, Safari)
- Local web server (required for loading shader files)

## Setup and Running

### Option 1: Using Python HTTP Server

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000`

### Option 2: Using Node.js HTTP Server

```bash
npx http-server -p 8000
```

Then open: `http://localhost:8000`

### Option 3: Using VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Controls

### Camera Movement
- **W** - Move forward
- **S** - Move backward
- **A** - Strafe left
- **D** - Strafe right
- **Space** - Move up
- **Shift** - Move down
- **Mouse Drag** - Look around
- **Mouse Wheel** - Adjust movement speed
- **R** - Reset camera position

### UI Controls
- **Transparency Slider** - Adjust glass transparency (0-100%)
- **Reset Camera Button** - Reset camera to initial position

## Technical Implementation

### Shaders
- `shaders/vertex.glsl` - Vertex shader with clipping plane support
- `shaders/fragment.glsl` - Fragment shader for regular objects with Phong lighting
- `shaders/glass.glsl` - Fragment shader for glass plane with Fresnel effect and reflection

### Rendering Pipeline

1. **Reflection Pass:**
   - Render scene to framebuffer from mirrored camera position
   - Use clipping plane to render only objects above glass plane
   - Store result in reflection texture

2. **Main Scene Pass:**
   - Render regular objects normally
   - Render glass plane with reflection texture sampling
   - Apply transparency based on viewing angle (Fresnel effect)

### Key Components

- **Camera System** (`js/camera.js`) - Flyby camera with mouse and keyboard controls
- **Geometry** (`js/geometry.js`) - Cube, sphere, and plane generation
- **Shaders** (`js/shaders.js`) - Shader loading and texture creation utilities
- **Framebuffer** (`js/framebuffer.js`) - Framebuffer management for reflection rendering
- **Main Application** (`js/main.js`) - Main rendering loop and scene management

## Project Structure

```
trabalhoPDI/
├── index.html              # Main HTML file
├── js/
│   ├── main.js            # Main application logic
│   ├── camera.js          # Flyby camera implementation
│   ├── geometry.js        # Geometry creation functions
│   ├── shaders.js         # Shader utilities
│   └── framebuffer.js    # Framebuffer management
├── shaders/
│   ├── vertex.glsl        # Vertex shader
│   ├── fragment.glsl      # Fragment shader for objects
│   └── glass.glsl          # Fragment shader for glass
└── README.md              # This file
```

## Requirements Met

✅ **Shader Customizado** - Custom vertex and fragment shaders implemented  
✅ **Reflexo e Transparência Dinâmicos** - Framebuffer-based reflection with multi-pass rendering  
✅ **Transparência Controlada** - Adjustable via uniform (UI slider)  
✅ **Textura padrão** - All objects have procedural textures  
✅ **Clipping plane** - Implemented using `gl_ClipDistance`  
✅ **Câmera flyby** - Full flyby camera with WASD + mouse controls  
✅ **Demonstração** - Real-time rendering with at least 2 objects divided by glass plane  

## Notes

- The application uses procedural textures (generated in code) for all objects
- Reflection is calculated using a framebuffer rendered from a mirrored camera position
- Transparency uses Fresnel effect: more transparent at grazing angles
- Clipping plane is used to render only objects above the glass plane in reflection pass

## Troubleshooting

**Black screen:**
- Ensure you're running from a web server (not file://)
- Check browser console for errors
- Verify WebGL2 support: `chrome://gpu` or `about:support` in Firefox

**Shaders not loading:**
- Check that shader files are in `shaders/` directory
- Verify web server is running
- Check browser console for 404 errors

**Performance issues:**
- Reduce reflection framebuffer resolution in `main.js` (currently 1024x1024)
- Reduce sphere segments in geometry creation

## License

Educational project for Computer Graphics course.
