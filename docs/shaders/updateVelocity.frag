#include <common>
uniform vec3 targetPos;
uniform float dt;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 vo = texture2D(velocityBuffer, uv).xyz;
    vec3 acc = texture2D(acceralationBuffer, uv).xyz;
    vec4 pos = texture2D(positionBuffer, uv);
    vec3 vel = vo + acc * dt;

    float len = length(vel);
    if(len >= 0.25)
        vel = normalize(vel)*0.25;

    // float dist = length(targetPos - pos.xyz);
    if(pos.w == 0.0)
        vel = vec3(0.0, 0.0, 0.0);

    gl_FragColor = vec4(vel, 1.0);
}