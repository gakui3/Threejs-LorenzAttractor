#include <common>
// uniform float dt;
uniform vec3 targetPos;
uniform float p;
uniform float r;
uniform float b;


void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    // vec4 pos = vec4(hash(vec2(uv.x, 0.5))*3.0, hash(vec2(uv.x, 0.3))*3.0, hash(vec2(uv.x, 0.1))*3.0, 1.0);
    // vec3 vec = texture2D(velocityBuffer, uv).xyz;
    // vec3 acc = texture2D(acceralationBuffer, uv).xyz;
    vec4 pos = texture2D(positionBuffer, uv);
    // pos.xyz += (vec * dt) + (1.0/2.0 * acc * dt * dt);

    float dist = length(targetPos - pos.xyz);
    if(pos.w >= 1.0){
        //pos = vec4((rand(pos.xz)-0.5)*4.0, (rand(pos.xy)-0.5)*4.0, (rand(pos.yz)-0.5)*4.0, 0.0);
        pos = vec4((rand(pos.xz)-0.5)*10.0, (rand(pos.xy)-0.5)*10.0, (rand(pos.yz)-0.5)*10.0, 0.0);
        //pos = vec4(0,0,0,0);
    }

    // float p = 10.0;
    // float r = 28.0;
    // float b = 8.0/3.0;
    float dt = 0.003;

    float dx = (-p * pos.x + p * pos.y) * dt;
    float dy = (-pos.x * pos.z + r * pos.x - pos.y) * dt;
    float dz = (pos.x * pos.y - b * pos.z) * dt;

    pos.xyz += vec3(dx, dy, dz);
    pos.w += dt;

    gl_FragColor = pos;
}