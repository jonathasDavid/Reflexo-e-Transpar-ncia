import { FlybyCamera } from './camera.js';
import { createCube, createSphere, createPlane } from './geometry.js';
import { loadShaderFromFile, createProgram, createProceduralTexture, loadTexture } from './shaders.js';
import { createFramebuffer } from './framebuffer.js';

class WebGLApp {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.gl = this.canvas.getContext('webgl2');

    if (!this.gl) {
      throw new Error('WebGL2 not supported');
    }

    this.camera = new FlybyCamera(this.canvas);
    this.transparency = 0.5;

    // Programs
    this.program = null;
    this.glassProgram = null;

    // Geometry
    this.objects = [];
    this.glassPlane = null;

    // Textures
    this.textures = [];
    this.glassTexture = null;

    // Framebuffer for reflection
    this.reflectionFBO = null;

    // Animation
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;

    // Init is async, handle errors
    this.init().catch(error => {
      console.error('Initialization error:', error);
      alert('Failed to initialize: ' + error.message);
    });
  }

  async init() {
    // Set canvas size
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Enable features
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    // Load shaders
    await this.loadShaders();

    // Create geometry
    this.createGeometry();

    // Create textures
    this.createTextures();

    // Create framebuffer
    this.createFramebuffers();

    // Setup UI
    this.setupUI();

    // Start render loop
    this.render();
  }

  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.camera.updateProjectionMatrix();

    // recria o FBO no novo tamanho
    this.createFramebuffers();
  }

  async loadShaders() {
    try {
      console.log('Loading shaders...');
      const vertexSource = await loadShaderFromFile('shaders/vertex.glsl');
      const fragmentSource = await loadShaderFromFile('shaders/fragment.glsl');
      const glassVertexSource = await loadShaderFromFile('shaders/glass.v.glsl');
      const glassFragmentSource = await loadShaderFromFile('shaders/glass.glsl');

      console.log('Compiling shaders...');
      this.program = await createProgram(this.gl, vertexSource, fragmentSource);
      console.log('Main program compiled successfully');

      this.glassProgram = await createProgram(this.gl, glassVertexSource, glassFragmentSource);
      console.log('Glass program compiled successfully');
    } catch (error) {
      console.error('Shader loading/compilation error:', error);
      throw error;
    }
  }

  createGeometry() {
    // Create cube - posicionado à esquerda do vidro (X negativo)
    const cube = createCube();
    const cubeVAO = this.createVAO(cube);
    this.objects.push({
      vao: cubeVAO,
      count: cube.indices.length,
      modelMatrix: this.createModelMatrix([-4, 1, -3], [0, 0, 0], [1.5, 1.5, 1.5])
    });

    // Create sphere - posicionada à direita do vidro (X positivo)
    const sphere = createSphere(1, 32);
    const sphereVAO = this.createVAO(sphere);
    this.objects.push({
      vao: sphereVAO,
      count: sphere.indices.length,
      modelMatrix: this.createModelMatrix([4, 1.5, -3], [0, 0, 0], [1.5, 1.5, 1.5])
    });

    // Create glass plane - vertical, entre os objetos
    const plane = createPlane(15, 10);
    this.glassPlane = {
      vao: this.createVAO(plane),
      count: plane.indices.length,
      modelMatrix: this.createVerticalPlaneMatrix([0, 2, -3])
    };
  }

  createVAO(geometry) {
    const vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(vao);

    // Positions
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, geometry.positions, this.gl.STATIC_DRAW);
    const posLoc = 0;
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(posLoc, 3, this.gl.FLOAT, false, 0, 0);

    // Normals
    const normalBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, geometry.normals, this.gl.STATIC_DRAW);
    const normalLoc = 1;
    this.gl.enableVertexAttribArray(normalLoc);
    this.gl.vertexAttribPointer(normalLoc, 3, this.gl.FLOAT, false, 0, 0);

    // TexCoords
    const texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, geometry.texCoords, this.gl.STATIC_DRAW);
    const texLoc = 2;
    this.gl.enableVertexAttribArray(texLoc);
    this.gl.vertexAttribPointer(texLoc, 2, this.gl.FLOAT, false, 0, 0);

    // Indices
    const indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, geometry.indices, this.gl.STATIC_DRAW);

    this.gl.bindVertexArray(null);
    return vao;
  }

  createTextures() {
    const texture = loadTexture(this.gl, 'textures/blueimg.jpg');
    this.textures.push(texture);
    this.textures.push(texture);
    this.glassTexture = texture;
  }

  createFramebuffers() {
    try {
      console.log('Creating framebuffers...');
      const width = 1024;
      const height = 1024;
      this.reflectionFBO = createFramebuffer(this.gl, width, height);
      console.log('Framebuffers created successfully');
    } catch (error) {
      console.error('Framebuffer creation error:', error);
      throw error;
    }
  }

  createModelMatrix(translation, rotation, scale) {
    const matrix = new Float32Array(16);

    // Identity matrix
    matrix[0] = scale[0]; matrix[1] = 0; matrix[2] = 0; matrix[3] = 0;
    matrix[4] = 0; matrix[5] = scale[1]; matrix[6] = 0; matrix[7] = 0;
    matrix[8] = 0; matrix[9] = 0; matrix[10] = scale[2]; matrix[11] = 0;
    matrix[12] = translation[0]; matrix[13] = translation[1]; matrix[14] = translation[2]; matrix[15] = 1;

    return matrix;
  }

  // Cria matriz para plano vertical (rotacionado 90° no eixo Z)
  createVerticalPlaneMatrix(translation) {
    const matrix = new Float32Array(16);
    
    // Rotação de 90° no eixo Z para deixar o plano vertical
    // O plano original tem normal (0, 1, 0), queremos normal (1, 0, 0)
    const cos90 = 0;
    const sin90 = 1;
    
    matrix[0] = cos90;  matrix[1] = sin90;  matrix[2] = 0;  matrix[3] = 0;
    matrix[4] = -sin90; matrix[5] = cos90;  matrix[6] = 0;  matrix[7] = 0;
    matrix[8] = 0;      matrix[9] = 0;      matrix[10] = 1; matrix[11] = 0;
    matrix[12] = translation[0]; matrix[13] = translation[1]; matrix[14] = translation[2]; matrix[15] = 1;

    return matrix;
  }

  calculateReflectionViewMatrix() {
    const cameraPos = this.camera.getPosition();
    const cameraFwd = this.camera.getForward();

    const cameraTarget = new Float32Array([
      cameraPos[0] + cameraFwd[0],
      cameraPos[1] + cameraFwd[1],
      cameraPos[2] + cameraFwd[2]
    ]);

    // Mirror position and target across the glass plane (x=0) - plano vertical
    const eye = new Float32Array([-cameraPos[0], cameraPos[1], cameraPos[2]]);
    const center = new Float32Array([-cameraTarget[0], cameraTarget[1], cameraTarget[2]]);

    // The 'up' vector is kept as (0, 1, 0) as the look-at calculation
    // will correctly orthogonalize the axes.
    const up = new Float32Array([0, 1, 0]);

    // Standard lookAt calculation
    const viewMatrix = new Float32Array(16);

    const f = new Float32Array(3);
    f[0] = center[0] - eye[0];
    f[1] = center[1] - eye[1];
    f[2] = center[2] - eye[2];
    const len = Math.sqrt(f[0] * f[0] + f[1] * f[1] + f[2] * f[2]);
    if (len > 0.0001) {
      f[0] /= len; f[1] /= len; f[2] /= len;
    }

    const s = new Float32Array(3);
    s[0] = f[1] * up[2] - f[2] * up[1];
    s[1] = f[2] * up[0] - f[0] * up[2];
    s[2] = f[0] * up[1] - f[1] * up[0];
    const slen = Math.sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2]);
    if (slen > 0.0001) {
      s[0] /= slen; s[1] /= slen; s[2] /= slen;
    }

    const u = new Float32Array(3);
    u[0] = s[1] * f[2] - s[2] * f[1];
    u[1] = s[2] * f[0] - s[0] * f[2];
    u[2] = s[0] * f[1] - s[1] * f[0];

    viewMatrix[0] = s[0];
    viewMatrix[1] = u[0];
    viewMatrix[2] = -f[0];
    viewMatrix[3] = 0;
    viewMatrix[4] = s[1];
    viewMatrix[5] = u[1];
    viewMatrix[6] = -f[1];
    viewMatrix[7] = 0;
    viewMatrix[8] = s[2];
    viewMatrix[9] = u[2];
    viewMatrix[10] = -f[2];
    viewMatrix[11] = 0;
    viewMatrix[12] = -(s[0] * eye[0] + s[1] * eye[1] + s[2] * eye[2]);
    viewMatrix[13] = -(u[0] * eye[0] + u[1] * eye[1] + u[2] * eye[2]);
    viewMatrix[14] = f[0] * eye[0] + f[1] * eye[1] + f[2] * eye[2];
    viewMatrix[15] = 1;

    return viewMatrix;
  }

  renderReflectionPass() {
    // Bind reflection framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.reflectionFBO.framebuffer);
    this.gl.viewport(0, 0, this.reflectionFBO.width, this.reflectionFBO.height);
    this.gl.clearColor(0.1, 0.1, 0.15, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Calculate reflection view matrix
    const reflectionView = this.calculateReflectionViewMatrix();

    // Clipping plane - renderiza objetos do lado positivo de X (x > 0)
    const clippingPlane = new Float32Array([1, 0, 0, 0]); // Normal apontando para +X

    // Reflected light position (espelhada no eixo X)
    const reflectedLightPos = new Float32Array([-5, 10, 5]);

    // Render objects
    this.gl.useProgram(this.program);
    this.setupProgramUniforms(this.program, reflectionView, clippingPlane, reflectedLightPos);

    this.objects.forEach((obj, index) => {
      this.gl.bindVertexArray(obj.vao);
      this.setModelMatrix(this.program, obj.modelMatrix);
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[index]);
      this.gl.drawElements(this.gl.TRIANGLES, obj.count, this.gl.UNSIGNED_SHORT, 0);
    });

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  renderMainScene() {
    // Render to screen
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.05, 0.05, 0.1, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Render regular objects
    this.gl.useProgram(this.program);
    this.setupProgramUniforms(this.program, this.camera.viewMatrix, null, new Float32Array([5, 10, 5]));

    this.objects.forEach((obj, index) => {
      this.gl.bindVertexArray(obj.vao);
      this.setModelMatrix(this.program, obj.modelMatrix);
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[index]);
      this.gl.drawElements(this.gl.TRIANGLES, obj.count, this.gl.UNSIGNED_SHORT, 0);
    });


    // Render glass plane
    this.gl.useProgram(this.glassProgram);

    this.gl.depthMask(false);
    this.setupGlassProgramUniforms();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.reflectionFBO.texture);

    this.gl.bindVertexArray(this.glassPlane.vao);
    this.setModelMatrix(this.glassProgram, this.glassPlane.modelMatrix);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.glassTexture);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.reflectionFBO.texture);
    this.gl.drawElements(this.gl.TRIANGLES, this.glassPlane.count, this.gl.UNSIGNED_SHORT, 0);

    this.gl.depthMask(true);
  }

  setupProgramUniforms(program, viewMatrix, clippingPlane, lightPos) {
    const loc = {
      model: this.gl.getUniformLocation(program, 'uModelMatrix'),
      view: this.gl.getUniformLocation(program, 'uViewMatrix'),
      proj: this.gl.getUniformLocation(program, 'uProjectionMatrix'),
      texture: this.gl.getUniformLocation(program, 'uTexture'),
      lightPos: this.gl.getUniformLocation(program, 'uLightPosition'),
      lightColor: this.gl.getUniformLocation(program, 'uLightColor'),
      cameraPos: this.gl.getUniformLocation(program, 'uCameraPosition'),
      clippingPlane: this.gl.getUniformLocation(program, 'uClippingPlane')
    };

    if (loc.view) this.gl.uniformMatrix4fv(loc.view, false, viewMatrix);
    if (loc.proj) this.gl.uniformMatrix4fv(loc.proj, false, this.camera.projectionMatrix);
    if (loc.texture) this.gl.uniform1i(loc.texture, 0);
    if (loc.lightPos) this.gl.uniform3fv(loc.lightPos, lightPos);
    if (loc.lightColor) this.gl.uniform3f(loc.lightColor, 1, 1, 1);
    if (loc.cameraPos) this.gl.uniform3fv(loc.cameraPos, this.camera.getPosition());

    if (loc.clippingPlane) {
      if (clippingPlane) {
        this.gl.uniform4fv(loc.clippingPlane, clippingPlane);
      } else {
        this.gl.uniform4f(loc.clippingPlane, 0, 0, 0, 0);
      }
    }
  }

  setupGlassProgramUniforms() {
    const loc = {
      model: this.gl.getUniformLocation(this.glassProgram, 'uModelMatrix'),
      view: this.gl.getUniformLocation(this.glassProgram, 'uViewMatrix'),
      proj: this.gl.getUniformLocation(this.glassProgram, 'uProjectionMatrix'),
      glassTexture: this.gl.getUniformLocation(this.glassProgram, 'uGlassTexture'),
      reflectionTexture: this.gl.getUniformLocation(this.glassProgram, 'uReflectionTexture'),
      transparency: this.gl.getUniformLocation(this.glassProgram, 'uTransparency'),
      cameraPos: this.gl.getUniformLocation(this.glassProgram, 'uCameraPosition'),
      clippingPlane: this.gl.getUniformLocation(this.glassProgram, 'uClippingPlane'),
      reflectionViewProj: this.gl.getUniformLocation(this.glassProgram, 'uReflectionViewProjectionMatrix')
    };

    if (loc.view) this.gl.uniformMatrix4fv(loc.view, false, this.camera.viewMatrix);
    if (loc.proj) this.gl.uniformMatrix4fv(loc.proj, false, this.camera.projectionMatrix);
    if (loc.glassTexture) this.gl.uniform1i(loc.glassTexture, 0);
    if (loc.reflectionTexture) this.gl.uniform1i(loc.reflectionTexture, 1);
    if (loc.transparency) this.gl.uniform1f(loc.transparency, this.transparency);
    if (loc.cameraPos) this.gl.uniform3fv(loc.cameraPos, this.camera.getPosition());
    if (loc.clippingPlane) this.gl.uniform4f(loc.clippingPlane, 0, 0, 0, 0); // No clipping for glass itself

    // Calculate reflection view-projection matrix
    if (loc.reflectionViewProj) {
      const reflectionView = this.calculateReflectionViewMatrix();
      const reflectionViewProj = this.multiplyMatrices(this.camera.projectionMatrix, reflectionView);
      this.gl.uniformMatrix4fv(loc.reflectionViewProj, false, reflectionViewProj);
    }
  }

  multiplyMatrices(a, b) {
    const out = new Float32Array(16);

    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
    const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
    const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

    out[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;

    out[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;

    out[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;

    out[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    out[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    out[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    out[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;

    return out;
  }

  setModelMatrix(program, matrix) {
    const loc = this.gl.getUniformLocation(program, 'uModelMatrix');
    if (loc) {
      this.gl.uniformMatrix4fv(loc, false, matrix);
    }
  }

  setupUI() {
    const transparencySlider = document.getElementById('transparency');
    const transparencyValue = document.getElementById('transparency-value');
    const resetButton = document.getElementById('reset-camera');

    transparencySlider.addEventListener('input', (e) => {
      this.transparency = e.target.value / 100;
      transparencyValue.textContent = e.target.value;
    });

    resetButton.addEventListener('click', () => {
      this.camera.reset();
    });

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.camera.reset();
      }
    });
  }

  updateFPS() {
    this.frameCount++;
    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / delta);
      document.getElementById('fps').textContent = `FPS: ${this.fps}`;
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  createFramebuffers() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.reflectionFBO = createFramebuffer(this.gl, width, height);
  }

  render() {
    this.camera.update();
    this.updateFPS();

    // Pass 1: Render reflection
    this.renderReflectionPass();

    // Pass 2: Render main scene
    this.renderMainScene();

    requestAnimationFrame(() => this.render());
  }
}



// Start application
window.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new WebGLApp();
    console.log('WebGL application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    console.error('Error stack:', error.stack);
    alert('Failed to initialize WebGL application. Please check the console for details.\n\nError: ' + error.message);
  }
});
