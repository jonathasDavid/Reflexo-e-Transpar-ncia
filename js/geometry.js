export function createCube() {
    const positions = new Float32Array([
        // Front face
        -1, -1,  1,  1, -1,  1,  1,  1,  1,  -1,  1,  1,
        // Back face
        -1, -1, -1,  -1,  1, -1,  1,  1, -1,  1, -1, -1,
        // Top face
        -1,  1, -1,  -1,  1,  1,  1,  1,  1,  1,  1, -1,
        // Bottom face
        -1, -1, -1,  1, -1, -1,  1, -1,  1,  -1, -1,  1,
        // Right face
         1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
        // Left face
        -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1,
    ]);
    
    const normals = new Float32Array([
        // Front
         0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,
        // Back
         0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,
        // Top
         0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,
        // Bottom
         0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,
        // Right
         1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,
        // Left
        -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0,
    ]);
    
    const texCoords = new Float32Array([
        // Front
        0, 0,  1, 0,  1, 1,  0, 1,
        // Back
        1, 0,  1, 1,  0, 1,  0, 0,
        // Top
        0, 1,  0, 0,  1, 0,  1, 1,
        // Bottom
        1, 1,  0, 1,  0, 0,  1, 0,
        // Right
        1, 0,  1, 1,  0, 1,  0, 0,
        // Left
        0, 0,  1, 0,  1, 1,  0, 1,
    ]);
    
    const indices = new Uint16Array([
        0,  1,  2,    0,  2,  3,    // front
        4,  5,  6,    4,  6,  7,    // back
        8,  9,  10,   8,  10, 11,   // top
        12, 13, 14,   12, 14, 15,   // bottom
        16, 17, 18,   16, 18, 19,   // right
        20, 21, 22,   20, 22, 23,   // left
    ]);
    
    return { positions, normals, texCoords, indices };
}

export function createSphere(radius = 1, segments = 32) {
    const positions = [];
    const normals = [];
    const texCoords = [];
    const indices = [];
    
    for (let lat = 0; lat <= segments; lat++) {
        const theta = lat * Math.PI / segments;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        
        for (let lon = 0; lon <= segments; lon++) {
            const phi = lon * 2 * Math.PI / segments;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            
            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            
            positions.push(radius * x, radius * y, radius * z);
            normals.push(x, y, z);
            texCoords.push(lon / segments, lat / segments);
        }
    }
    
    for (let lat = 0; lat < segments; lat++) {
        for (let lon = 0; lon < segments; lon++) {
            const first = lat * (segments + 1) + lon;
            const second = first + segments + 1;
            
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }
    
    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        texCoords: new Float32Array(texCoords),
        indices: new Uint16Array(indices)
    };
}

export function createPlane(width = 10, height = 10) {
    const w = width / 2;
    const h = height / 2;
    
    const positions = new Float32Array([
        -w, 0, -h,
         w, 0, -h,
         w, 0,  h,
        -w, 0,  h,
    ]);
    
    const normals = new Float32Array([
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
    ]);
    
    const texCoords = new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 1,
    ]);
    
    const indices = new Uint16Array([
        0, 1, 2,
        0, 2, 3,
    ]);
    
    return { positions, normals, texCoords, indices };
}
