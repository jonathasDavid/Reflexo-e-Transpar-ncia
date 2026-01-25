# Step-by-Step Guide: Reflection and Transparency WebGL Application

## Project Overview
Create a WebGL application that simulates a translucent reflective material (like dark glass) using custom shaders, framebuffers, and clipping planes.

---

## Phase 1: Project Setup

### Step 1.1: Initialize HTML Structure
- Create `index.html` with a canvas element
- Set up basic HTML5 structure
- Include WebGL context initialization script

### Step 1.2: Set Up WebGL Context
- Get WebGL2 context from canvas
- Configure viewport and clear color
- Enable necessary WebGL features:
  - Depth testing (`gl.DEPTH_TEST`)
  - Stencil testing (`gl.STENCIL_TEST`)
  - Blending for transparency (`gl.BLEND`)

### Step 1.3: Create Project Structure
```
project/
├── index.html
├── js/
│   ├── main.js          (Main application logic)
│   ├── camera.js        (Flyby camera controller)
│   ├── shaders.js       (Shader compilation utilities)
│   ├── geometry.js      (Object creation functions)
│   └── framebuffer.js   (Framebuffer management)
├── shaders/
│   ├── vertex.glsl      (Vertex shader)
│   ├── fragment.glsl    (Fragment shader for regular objects)
│   └── glass.glsl       (Fragment shader for glass plane)
└── textures/
    └── (texture images)
```

---

## Phase 2: Camera System

### Step 2.1: Implement Flyby Camera
- Create camera class with:
  - Position (vec3)
  - Target/forward direction
  - Up vector
  - Field of view, aspect ratio, near/far planes
- Implement keyboard controls (WASD + arrow keys)
- Implement mouse look for rotation
- Calculate view and projection matrices
- Update matrices on each frame

### Step 2.2: Camera Controls
- Forward/backward movement
- Left/right strafe
- Mouse drag for rotation (pitch/yaw)
- Optional: Mouse wheel for zoom

---

## Phase 3: Geometry and Scene Setup

### Step 3.1: Create Scene Objects
- Create at least 2 distinct 3D objects (e.g., cube, sphere, torus)
- Position objects on one side of the glass plane
- Ensure objects are visible from both sides of the plane

### Step 3.2: Create Glass Plane
- Create a large plane (quad) that divides the scene
- Position it between the objects and camera
- Store plane normal and position for clipping calculations

### Step 3.3: Load Textures
- Load texture images for all objects
- Load texture for the glass plane itself
- Create texture objects and bind to texture units
- Set texture parameters (wrap, filtering)

---

## Phase 4: Shader Development

### Step 4.1: Vertex Shader (Standard)
- Input: position, normal, texture coordinates
- Output: gl_Position, world position, normal, texCoords
- Transform vertices using model, view, projection matrices
- Pass data to fragment shader

### Step 4.2: Fragment Shader (Regular Objects)
- Sample texture based on texture coordinates
- Calculate lighting (Phong or similar)
- Output final color

### Step 4.3: Glass Vertex Shader
- Similar to standard vertex shader
- Calculate view direction
- Calculate reflection vector based on surface normal
- Pass reflection vector to fragment shader

### Step 4.4: Glass Fragment Shader
- **Transparency Calculation:**
  - Calculate angle between view direction and surface normal
  - Use Fresnel effect: more transparent at grazing angles
  - Apply transparency uniform for user control
  - Formula: `alpha = mix(minAlpha, maxAlpha, fresnel) * transparencyUniform`

- **Reflection Sampling:**
  - Use reflection vector to sample from reflection framebuffer
  - Transform reflection coordinates to framebuffer space
  - Sample reflection texture

- **Final Color:**
  - Mix reflection color with glass texture color
  - Apply transparency/alpha blending
  - Output: `vec4(color, alpha)`

---

## Phase 5: Framebuffer Setup (Reflection Rendering)

### Step 5.1: Create Reflection Framebuffer
- Create framebuffer object (FBO)
- Create texture attachment for color buffer
- Create renderbuffer for depth buffer
- Set appropriate resolution (e.g., 1024x1024)

### Step 5.2: Reflection Rendering Pass
- **Render to Framebuffer:**
  1. Bind reflection framebuffer
  2. Clear color and depth buffers
  3. Set up reflection camera (mirror camera position)
  4. Enable clipping plane to clip objects below glass plane
  5. Render scene objects (excluding glass plane)
  6. Unbind framebuffer

- **Reflection Camera Calculation:**
  - Mirror camera position across glass plane
  - Mirror camera forward direction
  - Calculate view matrix from mirrored position

### Step 5.3: Clipping Plane Implementation
- Define clipping plane equation: `plane = (normal, distance)`
- Pass clipping plane to shader as uniform
- In vertex shader: calculate distance from vertex to plane
- In fragment shader: discard fragments on wrong side
- Use `gl.clipDistance[0]` in WebGL2 (or manual discard)

---

## Phase 6: Multi-Pass Rendering

### Step 6.1: Render Reflection Pass
```
1. gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFBO)
2. gl.viewport(0, 0, reflectionWidth, reflectionHeight)
3. gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
4. Calculate reflection camera matrices
5. Set clipping plane uniform (clip objects below plane)
6. Render all scene objects (not glass)
7. gl.bindFramebuffer(gl.FRAMEBUFFER, null)
```

### Step 6.2: Render Main Scene
```
1. gl.bindFramebuffer(gl.FRAMEBUFFER, null) // Render to screen
2. gl.viewport(0, 0, canvas.width, canvas.height)
3. gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
4. Use normal camera matrices
5. Render scene objects normally
6. Render glass plane with reflection texture
```

### Step 6.3: Stencil Buffer for Transparency (Optional Enhancement)
- Use stencil buffer to mark glass plane area
- Render glass only where stencil is set
- Helps with proper depth sorting

---

## Phase 7: Shader Uniforms and Controls

### Step 7.1: Define Shader Uniforms
- **Regular Objects:**
  - `uModelMatrix`
  - `uViewMatrix`
  - `uProjectionMatrix`
  - `uTexture`
  - `uLightPosition`
  - `uLightColor`

- **Glass Shader:**
  - `uModelMatrix`
  - `uViewMatrix`
  - `uProjectionMatrix`
  - `uGlassTexture`
  - `uReflectionTexture` (from framebuffer)
  - `uTransparency` (adjustable uniform - **REQUIREMENT**)
  - `uClippingPlane` (normal + distance)
  - `uCameraPosition`

### Step 7.2: Create UI Controls
- Add HTML slider/input for transparency uniform
- Range: 0.0 (opaque) to 1.0 (fully transparent)
- Update uniform value on change
- Display current transparency value

---

## Phase 8: Integration and Rendering Loop

### Step 8.1: Main Render Function
```javascript
function render() {
    // Update camera
    camera.update();
    
    // Pass 1: Render reflection to framebuffer
    renderReflectionPass();
    
    // Pass 2: Render main scene
    renderMainScene();
    
    // Request next frame
    requestAnimationFrame(render);
}
```

### Step 8.2: Reflection Pass Function
```javascript
function renderReflectionPass() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFBO);
    gl.viewport(0, 0, reflectionWidth, reflectionHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Calculate mirrored camera
    const reflectionView = calculateReflectionViewMatrix();
    
    // Set clipping plane (objects above plane)
    const clippingPlane = [0, 1, 0, -planeY]; // Example
    
    // Render objects
    renderObjects(reflectionView, clippingPlane);
}
```

### Step 8.3: Main Scene Pass Function
```javascript
function renderMainScene() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Render regular objects
    renderObjects(camera.viewMatrix, null);
    
    // Render glass plane
    renderGlassPlane();
}
```

---

## Phase 9: Testing and Refinement

### Step 9.1: Verify Requirements
- ✅ Custom vertex and fragment shaders
- ✅ Reflection calculated from angle of view (Fresnel)
- ✅ Framebuffer-based reflection (not cube map)
- ✅ Multi-pass rendering (like shadow mapping)
- ✅ Transparency adjustable via uniform
- ✅ All objects have textures (including glass)
- ✅ Clipping plane used (no if statements for object selection)
- ✅ Flyby camera implemented
- ✅ At least 2 objects with plane dividing them

### Step 9.2: Visual Quality Checks
- Reflection appears realistic
- Transparency varies with viewing angle
- Objects visible through glass
- No visual artifacts or flickering
- Smooth camera movement

### Step 9.3: Performance Optimization
- Optimize framebuffer resolution
- Reduce unnecessary uniform updates
- Use efficient texture sampling
- Consider LOD for distant objects

---

## Phase 10: Final Polish

### Step 10.1: Add Lighting
- Implement Phong or Blinn-Phong lighting
- Add light source(s) to scene
- Calculate lighting in fragment shaders

### Step 10.2: Enhance Visuals
- Add environment (skybox or background)
- Improve texture quality
- Add subtle color tinting to glass
- Add specular highlights

### Step 10.3: User Interface
- Add controls panel
- Display instructions
- Show FPS counter
- Add reset camera button

---

## Technical Implementation Notes

### Clipping Plane Equation
- Plane defined as: `ax + by + cz + d = 0`
- Normal vector: `(a, b, c)`
- Distance: `d`
- In shader: `gl_ClipDistance[0] = dot(vertexPos, planeNormal) + planeDistance`

### Fresnel Effect Formula
```glsl
float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.0);
float alpha = mix(minAlpha, maxAlpha, fresnel) * uTransparency;
```

### Reflection Vector Calculation
```glsl
vec3 viewDir = normalize(cameraPos - worldPos);
vec3 reflectDir = reflect(-viewDir, normal);
```

### Framebuffer Texture Sampling
- Transform reflection coordinates to [0,1] range
- Account for framebuffer aspect ratio
- Handle edge cases (clamp or repeat)

---

## Development Order Recommendation

1. **Week 1:** Setup + Camera + Basic Geometry
2. **Week 2:** Shaders + Textures + Basic Rendering
3. **Week 3:** Framebuffer + Reflection Pass
4. **Week 4:** Clipping Plane + Transparency + Polish

---

## Resources and References

- WebGL2 API Documentation
- GLSL Shader Language Reference
- Matrix Mathematics for 3D Graphics
- Fresnel Equations
- Reflection and Refraction Techniques

---

## Common Pitfalls to Avoid

1. ❌ Using cube maps for reflection (must use framebuffer)
2. ❌ Using if statements to select objects (must use clipping plane)
3. ❌ Forgetting to update reflection framebuffer each frame
4. ❌ Not handling transparency blending correctly
5. ❌ Incorrect reflection camera calculation
6. ❌ Forgetting to apply textures to glass plane
7. ❌ Not making transparency adjustable via uniform

---

## Success Criteria

The application is complete when:
- All technical requirements are met
- Reflection updates dynamically as camera moves
- Transparency changes smoothly with viewing angle
- User can adjust transparency via UI control
- Scene contains at least 2 objects divided by glass plane
- Camera allows smooth flyby movement
- Application runs at interactive frame rates (30+ FPS)
