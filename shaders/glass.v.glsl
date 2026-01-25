#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uReflectionViewProjectionMatrix; // Matriz de reflexão (Projeção * Visualização)

out vec3 vWorldPosition;
out vec3 vNormal;
out vec2 vTexCoord;
out vec4 vReflectionTexCoord; // Coordenadas de textura para o reflexo

void main() {
    // Posição do vértice no espaço do mundo
    vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPos.xyz;

    // Normal no espaço do mundo
    mat3 normalMatrix = transpose(inverse(mat3(uModelMatrix)));
    vNormal = normalize(normalMatrix * aNormal);


    // Coordenadas de textura padrão
    vTexCoord = aTexCoord;

    // Calcula as coordenadas de clipe para a amostragem da textura de reflexão
    // Isso projeta a posição do vértice do mundo na "tela" da câmera de reflexão
    vReflectionTexCoord = uReflectionViewProjectionMatrix * worldPos;

    // Posição final do vértice na tela principal
    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
