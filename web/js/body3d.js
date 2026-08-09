/**
 * Procedural low-poly body (Phase 5 MVP).
 * Same region_id as 2D map — no external GLB required yet.
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/** @typedef {{ id: string, pos: [number, number, number], size: [number, number, number] }} RegionBox */

/** Approximate collider boxes — Y up, -X left, +Z anterior */
const REGION_BOXES = /** @type {RegionBox[]} */ ([
  { id: "head_cranial", pos: [0, 1.72, 0], size: [0.22, 0.14, 0.2] },
  { id: "face", pos: [0, 1.55, 0.08], size: [0.18, 0.16, 0.12] },
  { id: "cervical_anterior", pos: [0, 1.38, 0.06], size: [0.1, 0.12, 0.1] },
  { id: "cervical_posterior", pos: [0, 1.38, -0.06], size: [0.1, 0.12, 0.1] },
  { id: "shoulder_left", pos: [-0.28, 1.28, 0], size: [0.16, 0.12, 0.14] },
  { id: "shoulder_right", pos: [0.28, 1.28, 0], size: [0.16, 0.12, 0.14] },
  { id: "chest_anterior", pos: [0, 1.12, 0.08], size: [0.34, 0.28, 0.14] },
  { id: "upper_back", pos: [0, 1.14, -0.08], size: [0.14, 0.32, 0.1] },
  { id: "scapula_left", pos: [-0.16, 1.14, -0.1], size: [0.16, 0.2, 0.08] },
  { id: "scapula_right", pos: [0.16, 1.14, -0.1], size: [0.16, 0.2, 0.08] },
  { id: "upper_arm_left", pos: [-0.38, 1.0, 0], size: [0.1, 0.28, 0.1] },
  { id: "upper_arm_right", pos: [0.38, 1.0, 0], size: [0.1, 0.28, 0.1] },
  { id: "epigastric", pos: [0, 0.92, 0.08], size: [0.24, 0.12, 0.12] },
  { id: "elbow_forearm_left", pos: [-0.42, 0.72, 0], size: [0.1, 0.28, 0.1] },
  { id: "elbow_forearm_right", pos: [0.42, 0.72, 0], size: [0.1, 0.28, 0.1] },
  { id: "flank_left", pos: [-0.2, 0.82, 0], size: [0.1, 0.22, 0.14] },
  { id: "flank_right", pos: [0.2, 0.82, 0], size: [0.1, 0.22, 0.14] },
  { id: "abdomen_umbilical", pos: [0, 0.78, 0.08], size: [0.24, 0.14, 0.12] },
  { id: "abdomen_lower", pos: [0, 0.64, 0.08], size: [0.24, 0.12, 0.12] },
  { id: "lumbar_left", pos: [-0.12, 0.78, -0.08], size: [0.12, 0.2, 0.1] },
  { id: "lumbar_mid", pos: [0, 0.78, -0.08], size: [0.12, 0.22, 0.1] },
  { id: "lumbar_right", pos: [0.12, 0.78, -0.08], size: [0.12, 0.2, 0.1] },
  { id: "wrist_hand_left", pos: [-0.44, 0.5, 0.04], size: [0.1, 0.12, 0.08] },
  { id: "wrist_hand_right", pos: [0.44, 0.5, 0.04], size: [0.1, 0.12, 0.08] },
  { id: "sacrum_coccyx", pos: [0, 0.58, -0.08], size: [0.12, 0.12, 0.1] },
  { id: "hip_left", pos: [-0.14, 0.5, 0.02], size: [0.14, 0.14, 0.14] },
  { id: "hip_right", pos: [0.14, 0.5, 0.02], size: [0.14, 0.14, 0.14] },
  { id: "buttock_left", pos: [-0.12, 0.48, -0.1], size: [0.14, 0.16, 0.12] },
  { id: "buttock_right", pos: [0.12, 0.48, -0.1], size: [0.14, 0.16, 0.12] },
  { id: "thigh_left", pos: [-0.12, 0.28, 0], size: [0.12, 0.28, 0.12] },
  { id: "thigh_right", pos: [0.12, 0.28, 0], size: [0.12, 0.28, 0.12] },
  { id: "knee_left", pos: [-0.12, 0.08, 0.02], size: [0.12, 0.1, 0.12] },
  { id: "knee_right", pos: [0.12, 0.08, 0.02], size: [0.12, 0.1, 0.12] },
  { id: "calf_left", pos: [-0.12, -0.1, -0.02], size: [0.1, 0.24, 0.1] },
  { id: "calf_right", pos: [0.12, -0.1, -0.02], size: [0.1, 0.24, 0.1] },
  { id: "ankle_foot_left", pos: [-0.12, -0.28, 0.04], size: [0.12, 0.08, 0.18] },
  { id: "ankle_foot_right", pos: [0.12, -0.28, 0.04], size: [0.12, 0.08, 0.18] },
]);

const COLOR_IDLE = 0x3a6b5c;
const COLOR_HOVER = 0x4fd0b0;
const COLOR_ACTIVE = 0xffc45c;

export class Body3D {
  /**
   * @param {HTMLElement} container
   * @param {{ onSelect?: (regionId: string) => void }} [options]
   */
  constructor(container, options = {}) {
    this.container = container;
    this.onSelect = options.onSelect || (() => {});
    this.meshes = new Map();
    this.activeId = null;
    this.hoverId = null;
    this.raf = 0;
    this.disposed = false;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101a16);

    const w = container.clientWidth || 320;
    const h = container.clientHeight || 560;
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.camera.position.set(0, 0.85, 3.2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.75, 0);
    this.controls.enableDamping = true;
    this.controls.minDistance = 1.6;
    this.controls.maxDistance = 5;
    this.controls.maxPolarAngle = Math.PI * 0.85;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this._addLights();
    this._buildMeshes();
    this._bindEvents();
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(container);
    this._animate();
  }

  _addLights() {
    const amb = new THREE.AmbientLight(0xb8d4c8, 0.7);
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(2, 4, 3);
    const fill = new THREE.DirectionalLight(0x88aaaa, 0.35);
    fill.position.set(-2, 1, -2);
    this.scene.add(amb, key, fill);
  }

  _buildMeshes() {
    const group = new THREE.Group();
    for (const box of REGION_BOXES) {
      const geo = new THREE.BoxGeometry(...box.size);
      const mat = new THREE.MeshStandardMaterial({
        color: COLOR_IDLE,
        transparent: true,
        opacity: 0.82,
        roughness: 0.55,
        metalness: 0.05,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...box.pos);
      mesh.userData.regionId = box.id;
      this.meshes.set(box.id, mesh);
      group.add(mesh);
    }
    this.scene.add(group);
  }

  _bindEvents() {
    const el = this.renderer.domElement;
    this._onPointerMove = (e) => this._pointerMove(e);
    this._onClick = (e) => this._click(e);
    el.addEventListener("pointermove", this._onPointerMove);
    el.addEventListener("click", this._onClick);
  }

  _normPointer(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _hit(event) {
    this._normPointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.meshes.values()], false);
    return hits[0]?.object || null;
  }

  _pointerMove(event) {
    const mesh = this._hit(event);
    const id = mesh?.userData.regionId || null;
    if (id === this.hoverId) return;
    if (this.hoverId && this.hoverId !== this.activeId) {
      this._paint(this.hoverId, COLOR_IDLE);
    }
    this.hoverId = id;
    if (id && id !== this.activeId) this._paint(id, COLOR_HOVER);
    this.renderer.domElement.style.cursor = id ? "pointer" : "grab";
  }

  _click(event) {
    const mesh = this._hit(event);
    if (!mesh) return;
    const id = mesh.userData.regionId;
    this.setActive(id);
    this.onSelect(id);
  }

  _paint(regionId, color) {
    const mesh = this.meshes.get(regionId);
    if (mesh) mesh.material.color.setHex(color);
  }

  setActive(regionId) {
    if (this.activeId && this.activeId !== regionId) {
      this._paint(this.activeId, COLOR_IDLE);
    }
    this.activeId = regionId || null;
    if (regionId) this._paint(regionId, COLOR_ACTIVE);
  }

  resize() {
    if (this.disposed) return;
    const w = this.container.clientWidth || 320;
    const h = this.container.clientHeight || 560;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _animate = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this._animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this._ro?.disconnect();
    this.renderer.domElement.removeEventListener("pointermove", this._onPointerMove);
    this.renderer.domElement.removeEventListener("click", this._onClick);
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.meshes.clear();
  }
}

export function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}
