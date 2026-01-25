#version 300 es
precision highp float;

in vec3 vWorldPosition;
in vec3 vNormal;
in vec2 vTexCoord;
in float vClipDistance;

uniform sampler2D uTexture;
uniform vec3 uLightPosition;
uniform vec3 uCameraPosition;

out vec4 fragColor;

void main() {

    if (vClipDistance < 0.0) {
        discard;
    }

    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vWorldPosition);
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

    float ambient = 0.3;
    float diffuse = max(dot(normal, lightDir), 0.0);

    vec3 reflectDir = reflect(-lightDir, normal);
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

    vec3 lighting = vec3(ambient + diffuse * 0.7 + specular * 0.3);
    vec4 texColor = texture(uTexture, vTexCoord);

    fragColor = vec4(texColor.rgb * lighting, texColor.a);
}
