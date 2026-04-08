import * as THREE from 'three';
import { AmbientSettings } from '../level/level';

export class Renderer {
  three: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  playerLight: THREE.PointLight;

  constructor(canvas: HTMLCanvasElement) {
    this.three = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.three.setPixelRatio(window.devicePixelRatio);
    this.three.setSize(window.innerWidth, window.innerHeight, false);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    this.playerLight = new THREE.PointLight(0xffaa66, 0.8, 10, 2);
    this.scene.add(this.playerLight);

    window.addEventListener('resize', () => this.onResize());
  }

  applyAmbient(ambient: AmbientSettings): void {
    const fogColor = new THREE.Color(ambient.floorColor);
    this.scene.fog = new THREE.Fog(fogColor, 0, 1 / ambient.fogDensity);
    this.scene.background = fogColor;
  }

  setCamera(position: { x: number; z: number }, yaw: number, pitch: number, eyeHeight: number): void {
    this.camera.position.set(position.x, eyeHeight, position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = -yaw + Math.PI / 2;
    this.camera.rotation.x = pitch;
    this.playerLight.position.copy(this.camera.position);
  }

  render(): void {
    this.three.render(this.scene, this.camera);
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.three.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
