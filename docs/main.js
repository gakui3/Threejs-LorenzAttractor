import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// import { AdaptiveToneMappingPass } from 'three/examples/jsm/postprocessing/AdaptiveToneMappingPass.js';
// import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import drawVert from './shaders/draw.vert';
import drawFrag from './shaders/draw.frag';
import updatePosition from './shaders/updatePosition.frag';
import updateVelocity from './shaders/updateVelocity.frag';
import updateAcceralation from './shaders/updateAcceralation.frag';

let canvas,
  renderer,
  scene,
  camera,
  geometry,
  gui,
  gpuCompute,
  positionVariable,
  velocityVariable,
  acceralationVariable,
  particleCnt,
  divide,
  drawMaterial,
  composer,
  clock,
  bloomPass;
// adaptToneMappingPass,
// hdrToneMappingPass;

const particleUniforms = {
  positionBuffer: { value: null },
  velocityBuffer: { value: null },
  acceralationBuffer: { value: null },
  pSize: { value: 3.0 },
};

const params = {
  p: 10.0,
  r: 28.0,
  b: 2.66,
  pSize: 1.5,
};

const effectParams = {
  exposure: 1,
  Strength: 1.0,
  Threshold: 0.5,
  Radius: 1.0,
};

function init() {
  canvas = document.querySelector('#c');
  renderer = new THREE.WebGLRenderer({ canvas });
  // renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  particleCnt = 300000;
  divide = 100;
  clock = new THREE.Clock();
}

function initGPUComputationRenderer() {
  gpuCompute = new GPUComputationRenderer(particleCnt / divide, divide, renderer);

  const _positionBuffer = gpuCompute.createTexture();
  const _velocityBuffer = gpuCompute.createTexture();
  const _acceralationBuffer = gpuCompute.createTexture();

  initPositions(_positionBuffer);
  initVelocities(_velocityBuffer);
  initAcceralations(_acceralationBuffer);

  positionVariable = gpuCompute.addVariable('positionBuffer', updatePosition, _positionBuffer);
  velocityVariable = gpuCompute.addVariable('velocityBuffer', updateVelocity, _velocityBuffer);
  acceralationVariable = gpuCompute.addVariable(
    'acceralationBuffer',
    updateAcceralation,
    _acceralationBuffer
  );

  velocityVariable.material.uniforms.dt = { value: 0.03 };
  velocityVariable.material.uniforms.targetPos = { value: new THREE.Vector3(0, 0, 0) };

  positionVariable.material.uniforms.dt = { value: 0.03 };
  // positionVariable.material.uniforms.targetPos = { value: new THREE.Vector3(0, 0, 0) };
  positionVariable.material.uniforms.p = { value: 10.0 };
  positionVariable.material.uniforms.r = { value: 28.0 };
  positionVariable.material.uniforms.b = { value: 3.0 / 8.0 };

  acceralationVariable.material.uniforms.targetPos = { value: new THREE.Vector3(0, 0, 0) };

  gpuCompute.setVariableDependencies(positionVariable, [
    positionVariable,
    velocityVariable,
    acceralationVariable,
  ]);
  gpuCompute.setVariableDependencies(velocityVariable, [
    positionVariable,
    velocityVariable,
    acceralationVariable,
  ]);
  gpuCompute.setVariableDependencies(acceralationVariable, [
    positionVariable,
    velocityVariable,
    acceralationVariable,
  ]);

  var error = gpuCompute.init();
  if (error !== null) {
    console.error(error);
  }
}

function initPositions(buffer) {
  let posArray = buffer.image.data;

  for (let i = 0; i < posArray.length; i += 4) {
    // Position
    var x, y, z;

    posArray[i + 0] = (Math.random() - 0.5) * 5.0;
    posArray[i + 1] = (Math.random() - 0.5) * 5.0;
    posArray[i + 2] = (Math.random() - 0.5) * 5.0;
    posArray[i + 3] = Math.random();
  }
}

function initVelocities(buffer) {
  let velocityArray = buffer.image.data;

  for (let i = 0; i < velocityArray.length; i += 4) {
    // Position
    var x, y, z;

    velocityArray[i + 0] = 0;
    velocityArray[i + 1] = 0;
    velocityArray[i + 2] = 0;
    velocityArray[i + 3] = 0;
  }
}

function initAcceralations(buffer) {
  let acceralationArray = buffer.image.data;

  for (let i = 0; i < acceralationArray.length; i += 4) {
    // Position
    var x, y, z;

    acceralationArray[i + 0] = 0;
    acceralationArray[i + 1] = 0;
    acceralationArray[i + 2] = 0;
    acceralationArray[i + 3] = 0;
  }
}

function addCamera() {
  camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000);
  camera.position.set(0, 0, -50);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 50);
  controls.update();
}

function addObject() {
  geometry = new THREE.BufferGeometry();

  let positions = new Float32Array(particleCnt * 3);
  for (let i = 0; i < positions.length; i += 3) {
    let x = 10.0 * Math.random() - 10.0 / 2;
    let y = 10.0 * Math.random() - 10.0 / 2;
    let z = 10.0 * Math.random() - 10.0 / 2;
    positions[i] = x;
    positions[i + 1] = y;
    positions[i + 2] = z;
  }

  // let tes = new Float32Array(10000900);

  let uvs = new Float32Array(particleCnt * 2);
  for (let k = 0; k < divide; k++) {
    for (let i = 0; i < uvs.length / divide; i += 2) {
      let x = i / (particleCnt / divide);
      uvs[i * k] = x;
      uvs[i * k + 1] = k / divide;
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  drawMaterial = new THREE.ShaderMaterial({
    uniforms: particleUniforms,
    vertexShader: drawVert,
    fragmentShader: drawFrag,
  });
  drawMaterial.transparent = true;
  drawMaterial.blending = THREE.CustomBlending;
  drawMaterial.depthTest = false;
  drawMaterial.uniforms.pSize.value = 1.5;

  let points = new THREE.Points(geometry, drawMaterial);
  scene.add(points);
}

function addEffect() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  //composer.setSize(canvas.clientWidth, canvas.clientHeight);

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1,
    1,
    1
  );
  bloomPass.threshold = effectParams.Threshold;
  bloomPass.strength = effectParams.Strength;
  bloomPass.radius = effectParams.Radius;
  bloomPass.renderToScreen = true;
  composer.addPass(bloomPass);

  scene.fog = new THREE.Fog(0x000000, 0, 20);
}

function addGUI() {
  gui = new GUI();
  gui.width = 300;

  gui.add(params, 'p', 0.1, 20.0).onChange((_value) => {
    positionVariable.material.uniforms.p = { value: _value };
  });
  gui.add(params, 'r', 0.1, 50.0).onChange((_value) => {
    positionVariable.material.uniforms.r = { value: _value };
  });
  gui.add(params, 'b', 0, 3.0).onChange((_value) => {
    positionVariable.material.uniforms.b = { value: _value };
  });
  gui.add(params, 'pSize', 0.5, 5.0).onChange((_value) => {
    drawMaterial.uniforms.pSize.value = _value;
  });
}

function update() {
  requestAnimationFrame(update);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    composer.setSize(canvas.width, canvas.height);
  }

  gpuCompute.compute();

  particleUniforms.positionBuffer.value = gpuCompute.getCurrentRenderTarget(
    positionVariable
  ).texture;
  particleUniforms.velocityBuffer.value = gpuCompute.getCurrentRenderTarget(
    velocityVariable
  ).texture;
  particleUniforms.acceralationBuffer.value = gpuCompute.getCurrentRenderTarget(
    acceralationVariable
  ).texture;

  // renderer.render(scene, camera);
  composer.render(clock.getDelta());
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

(function () {
  init();
  initGPUComputationRenderer();
  addCamera();
  addObject();
  addEffect();
  addGUI();
  update();
})();
