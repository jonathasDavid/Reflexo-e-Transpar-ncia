export class FlybyCamera {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Camera properties
        this.position = new Float32Array([0, 5, 15]);
        this.yaw = -90.0; // Start looking forward
        this.pitch = -20.0; // Look slightly down
        
        // Movement
        this.moveSpeed = 5.0; // units per second
        this.rotationSpeed = 0.1; // radians per pixel
        
        // Mouse state
        this.isPointerLocked = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Matrices
        this.viewMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);
        
        // Time tracking for frame-rate independent movement
        this.lastFrameTime = performance.now();
        
        // Setup
        this.setupEventListeners();
        this.updateProjectionMatrix();
        this.updateViewMatrix();
    }
    
    setupEventListeners() {
        // Keyboard
        this.keys = {};
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            // Request pointer lock on click
            if (e.key === ' ' || e.key.toLowerCase() === 'w') {
                this.canvas.requestPointerLock = this.canvas.requestPointerLock || 
                                                 this.canvas.mozRequestPointerLock ||
                                                 this.canvas.webkitRequestPointerLock;
                if (this.canvas.requestPointerLock) {
                    this.canvas.requestPointerLock();
                }
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Pointer lock change
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas ||
                                   document.mozPointerLockElement === this.canvas ||
                                   document.webkitPointerLockElement === this.canvas;
        });
        
        document.addEventListener('mozpointerlockchange', () => {
            this.isPointerLocked = document.mozPointerLockElement === this.canvas;
        });
        
        document.addEventListener('webkitpointerlockchange', () => {
            this.isPointerLocked = document.webkitPointerLockElement === this.canvas;
        });
        
        // Mouse movement (with pointer lock)
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
                const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
                
                this.yaw += movementX * this.rotationSpeed;
                this.pitch -= movementY * this.rotationSpeed;
                
                // Clamp pitch to avoid gimbal lock
                this.pitch = Math.max(-89, Math.min(89, this.pitch));
                
                this.updateViewMatrix();
            }
        });
        
        // Click canvas to lock pointer
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock = this.canvas.requestPointerLock || 
                                             this.canvas.mozRequestPointerLock ||
                                             this.canvas.webkitRequestPointerLock;
            if (this.canvas.requestPointerLock) {
                this.canvas.requestPointerLock().catch(() => {
                    // Pointer lock failed, use regular mouse
                    this.setupFallbackMouseControls();
                });
            } else {
                this.setupFallbackMouseControls();
            }
        });
        
        // Mouse wheel for speed adjustment
        this.canvas.addEventListener('wheel', (e) => {
            this.moveSpeed += e.deltaY * 0.1;
            this.moveSpeed = Math.max(0.5, Math.min(20.0, this.moveSpeed));
            e.preventDefault();
        });
        
        // Escape to unlock pointer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.exitPointerLock = document.exitPointerLock ||
                                           document.mozExitPointerLock ||
                                           document.webkitExitPointerLock;
                if (document.exitPointerLock) {
                    document.exitPointerLock();
                }
            }
        });
    }
    
    setupFallbackMouseControls() {
        // Fallback: click and drag
        let isMouseDown = false;
        let lastX = 0;
        let lastY = 0;
        
        this.canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isMouseDown && !this.isPointerLocked) {
                const deltaX = e.clientX - lastX;
                const deltaY = e.clientY - lastY;
                
                this.yaw += deltaX * this.rotationSpeed;
                this.pitch -= deltaY * this.rotationSpeed;
                this.pitch = Math.max(-89, Math.min(89, this.pitch));
                
                lastX = e.clientX;
                lastY = e.clientY;
                
                this.updateViewMatrix();
            }
        });
    }
    
    update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000.0; // Convert to seconds
        this.lastFrameTime = currentTime;
        
        // Clamp delta time to prevent large jumps
        const dt = Math.min(deltaTime, 0.1);
        
        // Calculate forward direction from yaw and pitch
        const yawRad = this.yaw * Math.PI / 180;
        const pitchRad = this.pitch * Math.PI / 180;
        
        const forward = new Float32Array([
            Math.cos(pitchRad) * Math.cos(yawRad),
            Math.sin(pitchRad),
            Math.cos(pitchRad) * Math.sin(yawRad)
        ]);
        
        // Calculate right vector (perpendicular to forward and up)
        const up = new Float32Array([0, 1, 0]);
        const right = new Float32Array([
            forward[2] * up[1] - forward[1] * up[2],
            forward[0] * up[2] - forward[2] * up[0],
            forward[1] * up[0] - forward[0] * up[1]
        ]);
        
        // Normalize right vector
        const rightLen = Math.sqrt(right[0]**2 + right[1]**2 + right[2]**2);
        if (rightLen > 0.0001) {
            right[0] /= rightLen;
            right[1] /= rightLen;
            right[2] /= rightLen;
        }
        
        // Calculate actual movement speed for this frame
        const speed = this.moveSpeed * dt;
        
        // Movement
        if (this.keys['w']) {
            this.position[0] += forward[0] * speed;
            this.position[1] += forward[1] * speed;
            this.position[2] += forward[2] * speed;
        }
        if (this.keys['s']) {
            this.position[0] -= forward[0] * speed;
            this.position[1] -= forward[1] * speed;
            this.position[2] -= forward[2] * speed;
        }
        if (this.keys['a']) {
            this.position[0] += right[0] * speed;
            this.position[1] += right[1] * speed;
            this.position[2] += right[2] * speed;
        }
        if (this.keys['d']) {
            this.position[0] -= right[0] * speed;
            this.position[1] -= right[1] * speed;
            this.position[2] -= right[2] * speed;
        }
        if (this.keys[' ']) { // Space
            this.position[1] += speed;
        }
        if (this.keys['shift']) {
            this.position[1] -= speed;
        }
        
        this.updateViewMatrix();
    }
    
    updateViewMatrix() {
        // Calculate forward direction
        const yawRad = this.yaw * Math.PI / 180;
        const pitchRad = this.pitch * Math.PI / 180;
        
        const forward = new Float32Array([
            Math.cos(pitchRad) * Math.cos(yawRad),
            Math.sin(pitchRad),
            Math.cos(pitchRad) * Math.sin(yawRad)
        ]);
        
        // Calculate target (position + forward)
        const target = new Float32Array([
            this.position[0] + forward[0],
            this.position[1] + forward[1],
            this.position[2] + forward[2]
        ]);
        
        // LookAt matrix calculation
        const eye = this.position;
        const center = target;
        const up = new Float32Array([0, 1, 0]);
        
        const f = new Float32Array(3);
        f[0] = center[0] - eye[0];
        f[1] = center[1] - eye[1];
        f[2] = center[2] - eye[2];
        const len = Math.sqrt(f[0]**2 + f[1]**2 + f[2]**2);
        if (len > 0.0001) {
            f[0] /= len;
            f[1] /= len;
            f[2] /= len;
        }
        
        const s = new Float32Array(3);
        s[0] = f[1] * up[2] - f[2] * up[1];
        s[1] = f[2] * up[0] - f[0] * up[2];
        s[2] = f[0] * up[1] - f[1] * up[0];
        const slen = Math.sqrt(s[0]**2 + s[1]**2 + s[2]**2);
        if (slen > 0.0001) {
            s[0] /= slen;
            s[1] /= slen;
            s[2] /= slen;
        }
        
        const u = new Float32Array(3);
        u[0] = s[1] * f[2] - s[2] * f[1];
        u[1] = s[2] * f[0] - s[0] * f[2];
        u[2] = s[0] * f[1] - s[1] * f[0];
        
        this.viewMatrix[0] = s[0];
        this.viewMatrix[1] = u[0];
        this.viewMatrix[2] = -f[0];
        this.viewMatrix[3] = 0;
        this.viewMatrix[4] = s[1];
        this.viewMatrix[5] = u[1];
        this.viewMatrix[6] = -f[1];
        this.viewMatrix[7] = 0;
        this.viewMatrix[8] = s[2];
        this.viewMatrix[9] = u[2];
        this.viewMatrix[10] = -f[2];
        this.viewMatrix[11] = 0;
        this.viewMatrix[12] = -(s[0] * eye[0] + s[1] * eye[1] + s[2] * eye[2]);
        this.viewMatrix[13] = -(u[0] * eye[0] + u[1] * eye[1] + u[2] * eye[2]);
        this.viewMatrix[14] = f[0] * eye[0] + f[1] * eye[1] + f[2] * eye[2];
        this.viewMatrix[15] = 1;
    }
    
    updateProjectionMatrix() {
        const fov = 45 * Math.PI / 180;
        const aspect = this.canvas.width / this.canvas.height;
        const near = 0.1;
        const far = 100.0;
        
        const f = 1.0 / Math.tan(fov / 2);
        
        this.projectionMatrix[0] = f / aspect;
        this.projectionMatrix[1] = 0;
        this.projectionMatrix[2] = 0;
        this.projectionMatrix[3] = 0;
        this.projectionMatrix[4] = 0;
        this.projectionMatrix[5] = f;
        this.projectionMatrix[6] = 0;
        this.projectionMatrix[7] = 0;
        this.projectionMatrix[8] = 0;
        this.projectionMatrix[9] = 0;
        this.projectionMatrix[10] = (far + near) / (near - far);
        this.projectionMatrix[11] = -1;
        this.projectionMatrix[12] = 0;
        this.projectionMatrix[13] = 0;
        this.projectionMatrix[14] = (2 * far * near) / (near - far);
        this.projectionMatrix[15] = 0;
    }
    
    reset() {
        this.position = new Float32Array([0, 5, 15]);
        this.yaw = -90.0;
        this.pitch = -20.0;
        this.lastFrameTime = performance.now();
        this.updateViewMatrix();
    }
    
    getPosition() {
        return this.position;
    }

    getForward() {
        const yawRad = this.yaw * Math.PI / 180;
        const pitchRad = this.pitch * Math.PI / 180;
        
        const forward = new Float32Array([
            Math.cos(pitchRad) * Math.cos(yawRad),
            Math.sin(pitchRad),
            Math.cos(pitchRad) * Math.sin(yawRad)
        ]);
        return forward;
    }
}
