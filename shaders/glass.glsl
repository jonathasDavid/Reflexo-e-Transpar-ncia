#version 300 es
precision highp float;

// Varyings vindos do glass.v.glsl
in vec3 vWorldPosition;
in vec3 vNormal;
in vec2 vTexCoord;
in vec4 vReflectionTexCoord;

uniform sampler2D uGlassTexture;      // Textura padrão do vidro
uniform sampler2D uReflectionTexture; // Textura do framebuffer de reflexão
uniform vec3 uCameraPosition;
uniform float uTransparency;          // Controle de transparência via UI

out vec4 fragColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

    // --- Efeito Fresnel ---
    // Determina a mistura entre reflexão e refração com base no ângulo de visão.
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

    // --- Coordenadas da Textura de Reflexão ---
    // Converte as coordenadas de clipe (passadas pelo vertex shader) para coordenadas de textura [0, 1]
    vec2 reflectionUV = (vReflectionTexCoord.xy / vReflectionTexCoord.w) * 0.5 + 0.5;
    
    // É necessário inverter a coordenada Y porque a origem da textura do framebuffer é diferente
    reflectionUV.y = 1.0 - reflectionUV.y;

    // --- Amostragem das Texturas ---
    vec4 reflectionColor = texture(uReflectionTexture, reflectionUV);
    vec4 glassColor = texture(uGlassTexture, vTexCoord);

    // --- Cor Final ---
    // Mistura a cor do vidro (base) com a cor da reflexão usando o fator de Fresnel
    vec3 finalColor = mix(glassColor.rgb, reflectionColor.rgb, fresnel);
    
    // Adiciona uma leve tonalidade azulada para simular vidro
    finalColor *= vec3(0.9, 0.95, 1.0);

    // --- Alpha Final ---
    // A transparência geral é controlada pelo uniform, modulada pelo ângulo de visão
    float alpha = mix(0.1, 0.9, fresnel) * uTransparency;

    fragColor = vec4(finalColor, alpha);
}
