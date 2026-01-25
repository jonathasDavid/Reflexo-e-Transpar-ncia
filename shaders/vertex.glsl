#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec4 uClippingPlane;

out vec3 vWorldPosition;
out vec3 vNormal;
out vec2 vTexCoord;
out float vClipDistance;

void main() {
    vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPos.xyz;

    // Normal em espaço de mundo
  
    mat3 normalMatrix = transpose(inverse(mat3(uModelMatrix)));
    vNormal = normalize(normalMatrix * aNormal);


    vTexCoord = aTexCoord;

    // Clipping plane
    vClipDistance = dot(worldPos, uClippingPlane);

    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
