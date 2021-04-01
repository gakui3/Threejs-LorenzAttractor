#include <common>
varying vec4 vColor;
varying vec2 vUv;

void main() {

      float f = distance( gl_PointCoord, vec2( 0.5, 0.5 ) );
      if ( f > 0.5 ) {
            discard;
      }
      f *= 2.0;
      gl_FragColor = vec4(vColor.rgb, 1.0-f);

      // gl_FragColor = vec4(gl_PointCoord, 0.0, 1.0);
}