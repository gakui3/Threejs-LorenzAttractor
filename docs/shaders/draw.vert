#include <common>
uniform sampler2D positionBuffer;
uniform float pSize;

varying vec4 vColor;
// varying vec2 vUv;


void main() {
      vec4 posTemp = texture2D( positionBuffer, uv );
      vec3 pos = posTemp.xyz;

      gl_PointSize = pSize;
      vColor = vec4(1.0, 1.0, 1.0, 1.0);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
}