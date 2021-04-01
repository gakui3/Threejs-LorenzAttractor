#include <common>
uniform vec3 targetPos;

float hash(vec2 d) {
    float angleY = 311.7;
    float y = 43758.5453123;
    float x = 127.1;
    float m = dot(d, vec2(x,angleY)); // 
    return -1.0 + 2.0*fract(sin(m)*y); // 
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 vel = texture2D(acceralationBuffer, uv).xyz;
    vec3 pos = texture2D(positionBuffer, uv).xyz;

    vec3 acc = (targetPos.xyz - pos.xyz)*0.1;

    // float dist = length(targetPos - pos);

    gl_FragColor = vec4(acc, 1.0);
}