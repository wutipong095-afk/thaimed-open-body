/**
 * 3D body viewer — Z-Anatomy GLB (Draco) with procedural box fallback.
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import {
  resolveRegionFromMuscle,
  regionFromPosition,
  cleanMuscleLabel,
} from "./muscleRegion.js";
import { formatMuscleLabelThEn } from "./muscleNames.js";

export const MODEL_URL = new URL("../models/zanatomy-muscles-web.glb", import.meta.url).href;
/** Self-hosted Draco decoder (see web/vendor/README.md) */
const DRACO_PATH = new URL("../vendor/draco/", import.meta.url).href;

const COLOR_IDLE = 0x3a6b5c;
const COLOR_HOVER = 0x5ee0c0;
/** Latest click — bright amber */
const COLOR_ACTIVE = 0xffc45c;
/** Previously selected — keep warm tint until session clear */
const COLOR_SELECTED = 0xe8a84a;

/** @typedef {{ id: string, pos: [number, number, number], size: [number, number, number] }} RegionBox */

const REGION_BOXES = /** @type {RegionBox[]} */ ([
  { id: "head_cranial", pos: [0, 1.72, 0], size: [0.22, 0.14, 0.2] },
  { id: "face", pos: [0, 1.55, 0.08], size: [0.18, 0.16, 0.12] },
  { id: "cervical_anterior", pos: [0, 1.38, 0.06], size: [0.1, 0.12, 0.1] },
  { id: "cervical_posterior", pos: [0, 1.38, -0.06], size: [0.1, 0.12, 0.1] },
  // Anatomical left = +X (facing camera), right = −X — matches Z-Anatomy
  { id: "shoulder_left", pos: [0.28, 1.28, 0], size: [0.16, 0.12, 0.14] },
  { id: "shoulder_right", pos: [-0.28, 1.28, 0], size: [0.16, 0.12, 0.14] },
  { id: "chest_anterior", pos: [0, 1.12, 0.08], size: [0.34, 0.28, 0.14] },
  { id: "upper_back", pos: [0, 1.14, -0.08], size: [0.14, 0.32, 0.1] },
  { id: "scapula_left", pos: [0.16, 1.14, -0.1], size: [0.16, 0.2, 0.08] },
  { id: "scapula_right", pos: [-0.16, 1.14, -0.1], size: [0.16, 0.2, 0.08] },
  { id: "upper_arm_left", pos: [0.38, 1.0, 0], size: [0.1, 0.28, 0.1] },
  { id: "upper_arm_right", pos: [-0.38, 1.0, 0], size: [0.1, 0.28, 0.1] },
  { id: "epigastric", pos: [0, 0.92, 0.08], size: [0.24, 0.12, 0.12] },
  { id: "elbow_forearm_left", pos: [0.42, 0.72, 0], size: [0.1, 0.28, 0.1] },
  { id: "elbow_forearm_right", pos: [-0.42, 0.72, 0], size: [0.1, 0.28, 0.1] },
  { id: "flank_left", pos: [0.2, 0.82, 0], size: [0.1, 0.22, 0.14] },
  { id: "flank_right", pos: [-0.2, 0.82, 0], size: [0.1, 0.22, 0.14] },
  { id: "abdomen_umbilical", pos: [0, 0.78, 0.08], size: [0.24, 0.14, 0.12] },
  { id: "abdomen_lower", pos: [0, 0.64, 0.08], size: [0.24, 0.12, 0.12] },
  { id: "lumbar_left", pos: [0.12, 0.78, -0.08], size: [0.12, 0.2, 0.1] },
  { id: "lumbar_mid", pos: [0, 0.78, -0.08], size: [0.12, 0.22, 0.1] },
  { id: "lumbar_right", pos: [-0.12, 0.78, -0.08], size: [0.12, 0.2, 0.1] },
  { id: "wrist_hand_left", pos: [0.44, 0.5, 0.04], size: [0.1, 0.12, 0.08] },
  { id: "wrist_hand_right", pos: [-0.44, 0.5, 0.04], size: [0.1, 0.12, 0.08] },
  { id: "sacrum_coccyx", pos: [0, 0.58, -0.08], size: [0.12, 0.12, 0.1] },
  { id: "hip_left", pos: [0.14, 0.5, 0.02], size: [0.14, 0.14, 0.14] },
  { id: "hip_right", pos: [-0.14, 0.5, 0.02], size: [0.14, 0.14, 0.14] },
  { id: "buttock_left", pos: [0.12, 0.48, -0.1], size: [0.14, 0.16, 0.12] },
  { id: "buttock_right", pos: [-0.12, 0.48, -0.1], size: [0.14, 0.16, 0.12] },
  { id: "thigh_left", pos: [0.12, 0.28, 0], size: [0.12, 0.28, 0.12] },
  { id: "thigh_right", pos: [-0.12, 0.28, 0], size: [0.12, 0.28, 0.12] },
  { id: "knee_left", pos: [0.12, 0.08, 0.02], size: [0.12, 0.1, 0.12] },
  { id: "knee_right", pos: [-0.12, 0.08, 0.02], size: [0.12, 0.1, 0.12] },
  { id: "calf_left", pos: [0.12, -0.1, -0.02], size: [0.1, 0.24, 0.1] },
  { id: "calf_right", pos: [-0.12, -0.1, -0.02], size: [0.1, 0.24, 0.1] },
  { id: "ankle_foot_left", pos: [0.12, -0.28, 0.04], size: [0.12, 0.08, 0.18] },
  { id: "ankle_foot_right", pos: [-0.12, -0.28, 0.04], size: [0.12, 0.08, 0.18] },
]);

export class Body3D {
  /**
   * @param {HTMLElement} container
   * @param {{ onSelect?: (regionId: string, meta?: object) => void, onStatus?: (msg: string) => void }} [options]
   */
  constructor(container, options = {}) {
    this.container = container;
    this.onSelect = options.onSelect || (() => {});
    this.onStatus = options.onStatus || (() => {});
    /** @type {THREE.Object3D[]} */
    this.clickable = [];
    /** @type {Map<string, THREE.Mesh[]>} */
    this.byRegion = new Map();
    this.activeId = null;
    this.activeMesh = null;
    this.hoverMesh = null;
    /** @type {Set<THREE.Mesh>} meshes that keep selection color */
    this.selectedMeshes = new Set();
    this.raf = 0;
    this.disposed = false;
    this.mode = "loading"; // loading | glb | boxes
    this.modelRoot = null;
    this.modelHeight = 1.7;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101a16);

    const w = container.clientWidth || 320;
    const h = container.clientHeight || 560;
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.01, 200);
    this.camera.position.set(0, 1.0, 3.4);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.9, 0);
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 8;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._tintColor = new THREE.Color();

    this._addLights();
    this._bindEvents();
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(container);
    this._animate();
    this._loadModel();
  }

  _addLights() {
    this.scene.add(new THREE.AmbientLight(0xc8ddd4, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(2.2, 4.5, 3.2);
    const fill = new THREE.DirectionalLight(0x88aaaa, 0.45);
    fill.position.set(-2.5, 1.2, -2);
    const rim = new THREE.DirectionalLight(0xffe0c0, 0.25);
    rim.position.set(0, 2, -3);
    this.scene.add(key, fill, rim);
  }

  _loadModel() {
    this.onStatus("กำลังโหลดโมเดลกล้ามเนื้อ (Z-Anatomy)…");
    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_PATH);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(
      MODEL_URL,
      (gltf) => {
        if (this.disposed) return;
        this.modelRoot = gltf.scene;
        this._prepareGltf(this.modelRoot);
        if (this.mode === "boxes") return;
        this.scene.add(this.modelRoot);
        if (this.clickable.length) {
          const box = new THREE.Box3();
          for (const m of this.clickable) box.expandByObject(m);
          this._frameBox(box);
        } else {
          this._frameObject(this.modelRoot);
        }
        this.mode = "glb";
        this.onStatus(
          `โมเดล Z-Anatomy พร้อม (${this.clickable.length} ส่วน) · ลากหมุน · คลิกกล้ามเนื้อ`
        );
      },
      (ev) => {
        if (!ev.total) return;
        const pct = Math.round((ev.loaded / ev.total) * 100);
        this.onStatus(`กำลังโหลดโมเดล… ${pct}%`);
      },
      (err) => {
        console.warn("GLB load failed, using box fallback", err);
        this.onStatus("โหลด GLB ไม่ได้ — ใช้โหมดกล่องแทน");
        this._buildBoxFallback();
        this.mode = "boxes";
      }
    );
  }

  /** Blender glTF exporter turns "Muscular system.g" into "Muscular_systemg". */
  _nameKey(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  _isCollectionBoardMesh(obj) {
    if (!obj?.isMesh) return false;
    // Z-Anatomy collection nodes are meshes that own child anatomy meshes.
    // Hiding the Object3D would hide children — strip geometry instead.
    if (obj.children.length > 0) return true;
    const key = this._nameKey(obj.name);
    if (!key) return false;
    if (key.startsWith("howto") || key.includes("navigation") || key.includes("cheatsheet")) {
      return true;
    }
    // Sanitized ".g" boards without children still end with these stems.
    if (
      /(system|muscles|bursae|sheaths|terms|movements|lines|planes|organs|joints|fasciae|regions)g$/.test(
        key
      )
    ) {
      return true;
    }
    return false;
  }

  _stripBoardGeometry(obj) {
    if (obj.geometry) {
      obj.geometry.dispose();
      obj.geometry = new THREE.BufferGeometry();
    }
    obj.userData.isBoard = true;
    obj.raycast = () => {};
  }

  _keepMuscularOnly(root) {
    // Default scene roots include every organ system + UI boards.
    const keep = [];
    const drop = [];
    for (const child of [...root.children]) {
      const key = this._nameKey(child.name);
      if (key.startsWith("muscularsystem")) keep.push(child);
      else drop.push(child);
    }
    if (!keep.length) return false;
    for (const child of drop) {
      child.visible = false;
      child.removeFromParent();
    }
    return true;
  }

  _prepareGltf(root) {
    this.clickable = [];
    this.byRegion.clear();

    if (!this._keepMuscularOnly(root)) {
      this.onStatus("ไม่พบ Muscular system ใน GLB — ใช้โหมดกล่องแทน");
      this._buildBoxFallback();
      this.mode = "boxes";
      return;
    }

    root.traverse((obj) => {
      if (!obj.isMesh) return;
      if (this._isCollectionBoardMesh(obj)) this._stripBoardGeometry(obj);
    });

    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) {
      this.onStatus("โมเดลว่างหลังกรอง UI — ใช้โหมดกล่องแทน");
      this._buildBoxFallback();
      this.mode = "boxes";
      return;
    }
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    root.position.sub(center);
    const scale = size.y > 0.001 ? 1.7 / size.y : 1;
    root.scale.multiplyScalar(scale);
    root.updateMatrixWorld(true);
    this.modelHeight = 1.7;

    root.traverse((obj) => {
      if (!obj.isMesh || !obj.visible || obj.userData.isBoard) return;
      if (!obj.geometry?.attributes?.position?.count) return;
      obj.castShadow = false;
      obj.receiveShadow = false;
      if (obj.material) {
        // Clone so hover/active emissive does not tint every shared muscle.
        if (Array.isArray(obj.material)) {
          obj.material = obj.material.map((m) => (m ? m.clone() : m));
        } else {
          obj.material = obj.material.clone();
        }
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (!m) return;
          m.side = THREE.DoubleSide;
          if ("emissive" in m) {
            m.emissive = m.emissive || new THREE.Color(0x000000);
            m.emissiveIntensity = 0;
          }
        });
      }
      const rawName = obj.name || obj.parent?.name || "muscle";
      const label = cleanMuscleLabel(rawName);
      const box = new THREE.Box3().setFromObject(obj);
      const c = box.getCenter(new THREE.Vector3());
      const norm = {
        x: c.x / Math.max(this.modelHeight * 0.35, 0.01),
        y: (c.y + this.modelHeight * 0.05) / this.modelHeight,
        z: c.z / Math.max(this.modelHeight * 0.25, 0.01),
      };
      // Resolve from raw name (keeps glued …musclel / Deltoidl) + center X for side
      const resolved = resolveRegionFromMuscle(rawName, norm);
      obj.userData.rawName = rawName;
      obj.userData.muscleName = label;
      obj.userData.regionId = resolved.regionId;
      obj.userData.side = resolved.side;
      obj.userData.matchedBy = resolved.matchedBy;
      obj.userData.baseEmissive = null;
      this.clickable.push(obj);
      this._indexRegion(resolved.regionId, obj);
    });
  }

  _buildBoxFallback() {
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
      mesh.userData.muscleName = box.id;
      this.clickable.push(mesh);
      this._indexRegion(box.id, mesh);
      group.add(mesh);
    }
    this.scene.add(group);
    this.controls.target.set(0, 0.85, 0);
    this.camera.position.set(0, 0.9, 3.2);
  }

  _indexRegion(regionId, mesh) {
    if (!this.byRegion.has(regionId)) this.byRegion.set(regionId, []);
    this.byRegion.get(regionId).push(mesh);
  }

  _frameObject(obj) {
    this._frameBox(new THREE.Box3().setFromObject(obj));
  }

  _frameBox(box) {
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    this.controls.target.copy(center);
    const dist = Math.max(size.x, size.y, size.z) * 1.45;
    this.camera.position.set(center.x, center.y + size.y * 0.02, center.z + dist);
    this.controls.minDistance = dist * 0.35;
    this.controls.maxDistance = dist * 4;
    this.controls.update();
  }

  _bindEvents() {
    const el = this.renderer.domElement;
    this._ptrDown = null;
    this._onPointerDown = (e) => {
      this._ptrDown = { x: e.clientX, y: e.clientY };
    };
    this._onPointerMove = (e) => this._pointerMove(e);
    this._onClick = (e) => this._click(e);
    this._onPointerLeave = () => {
      if (this.hoverMesh) this._restyleMesh(this.hoverMesh);
      this.hoverMesh = null;
      this.renderer.domElement.style.cursor = "grab";
    };
    el.addEventListener("pointerdown", this._onPointerDown);
    el.addEventListener("pointermove", this._onPointerMove);
    el.addEventListener("pointerleave", this._onPointerLeave);
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
    const hits = this.raycaster.intersectObjects(this.clickable, false);
    return hits[0] || null;
  }

  _mats(mesh) {
    if (!mesh?.material) return [];
    return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  }

  _captureBaseAppearance(mesh) {
    if (!mesh || mesh.userData.baseCaptured) return;
    const mats = this._mats(mesh);
    mesh.userData.baseColors = mats.map((m) => (m?.color ? m.color.getHex() : null));
    mesh.userData.baseEmissives = mats.map((m) =>
      m && "emissive" in m && m.emissive ? m.emissive.getHex() : 0x000000
    );
    mesh.userData.baseEmissiveIntensities = mats.map((m) =>
      m && "emissiveIntensity" in m ? m.emissiveIntensity ?? 0 : 0
    );
    mesh.userData.baseCaptured = true;
  }

  /**
   * @param {THREE.Mesh} mesh
   * @param {"idle"|"hover"|"selected"|"active"} style
   */
  _applyMeshStyle(mesh, style) {
    if (!mesh?.material) return;
    this._captureBaseAppearance(mesh);
    const mats = this._mats(mesh);
    const bases = mesh.userData.baseColors || [];
    const baseE = mesh.userData.baseEmissives || [];
    const baseEi = mesh.userData.baseEmissiveIntensities || [];

    for (let i = 0; i < mats.length; i++) {
      const m = mats[i];
      if (!m) continue;

      if (style === "idle") {
        if (m.color) {
          const bc = bases[i];
          m.color.setHex(bc != null ? bc : this.mode === "boxes" ? COLOR_IDLE : 0x888888);
        }
        if ("emissive" in m && m.emissive) {
          m.emissive.setHex(baseE[i] ?? 0x000000);
          m.emissiveIntensity = baseEi[i] ?? 0;
        }
        continue;
      }

      const tint =
        style === "hover" ? COLOR_HOVER : style === "active" ? COLOR_ACTIVE : COLOR_SELECTED;
      const eIntensity = style === "hover" ? 0.45 : style === "active" ? 0.85 : 0.7;

      if (m.color) {
        if (this.mode === "boxes") {
          m.color.setHex(tint);
        } else {
          // Blend toward amber so selection stays visible on gray Z-Anatomy mats
          const base = bases[i] != null ? bases[i] : m.color.getHex();
          m.color.setHex(base);
          this._tintColor.setHex(tint);
          m.color.lerp(this._tintColor, style === "hover" ? 0.35 : 0.55);
        }
      }
      if ("emissive" in m) {
        if (!m.emissive) m.emissive = new THREE.Color(0x000000);
        m.emissive.setHex(tint);
        m.emissiveIntensity = eIntensity;
      }
    }
  }

  _restyleMesh(mesh) {
    if (!mesh) return;
    if (mesh === this.activeMesh) this._applyMeshStyle(mesh, "active");
    else if (this.selectedMeshes.has(mesh)) this._applyMeshStyle(mesh, "selected");
    else this._applyMeshStyle(mesh, "idle");
  }

  _pointerMove(event) {
    const hit = this._hit(event);
    const mesh = hit?.object || null;
    if (mesh === this.hoverMesh) return;
    if (this.hoverMesh) this._restyleMesh(this.hoverMesh);
    this.hoverMesh = mesh;
    if (mesh && mesh !== this.activeMesh) {
      this._applyMeshStyle(mesh, "hover");
    }
    this.renderer.domElement.style.cursor = mesh ? "pointer" : "grab";
  }

  _click(event) {
    if (this._ptrDown) {
      const dx = event.clientX - this._ptrDown.x;
      const dy = event.clientY - this._ptrDown.y;
      if (dx * dx + dy * dy > 25) return; // treat as orbit drag
    }
    const hit = this._hit(event);
    if (!hit) return;
    const mesh = hit.object;
    const rawName = mesh.userData.rawName || mesh.name || "";
    const muscleName = mesh.userData.muscleName || cleanMuscleLabel(rawName);
    const local = hit.point.clone();
    const norm = {
      x: local.x / Math.max(this.modelHeight * 0.35, 0.01),
      y: (local.y + this.modelHeight * 0.05) / this.modelHeight,
      z: local.z / Math.max(this.modelHeight * 0.25, 0.01),
    };
    // Always re-resolve with hit point so L/R tracks the clicked side
    const resolved = resolveRegionFromMuscle(rawName || muscleName, norm);
    let regionId = resolved.regionId;
    let side = resolved.side;
    let matchedBy = resolved.matchedBy;
    if (matchedBy === "fallback") {
      regionId = regionFromPosition(norm);
      matchedBy = "position";
    }
    mesh.userData.regionId = regionId;
    mesh.userData.side = side;

    const named = formatMuscleLabelThEn(rawName || muscleName, side);

    // Click again on the same mesh → clear color at that spot
    if (this.selectedMeshes.has(mesh)) {
      this.deselectMesh(mesh);
      this.onStatus(`ยกเลิก: ${named.lineTh}`);
      this.onSelect(regionId, {
        muscleName: rawName || muscleName,
        muscleLabel: named,
        side,
        matchedBy,
        mesh,
        source: this.mode,
        deselected: true,
      });
      return;
    }

    this.setActive(regionId, mesh);
    this.onStatus(`เลือก: ${named.lineTh}`);
    this.onSelect(regionId, {
      muscleName: rawName || muscleName,
      muscleLabel: named,
      side,
      matchedBy,
      mesh,
      source: this.mode,
      deselected: false,
    });
  }

  /** Remove one mesh from selection and restore its material. */
  deselectMesh(mesh) {
    if (!mesh) return;
    this.selectedMeshes.delete(mesh);
    if (this.activeMesh === mesh) {
      const rest = [...this.selectedMeshes];
      this.activeMesh = rest.length ? rest[rest.length - 1] : null;
      this.activeId = this.activeMesh?.userData?.regionId || null;
    }
    if (this.hoverMesh === mesh) this._applyMeshStyle(mesh, "hover");
    else this._applyMeshStyle(mesh, "idle");
    if (this.activeMesh) this._applyMeshStyle(this.activeMesh, "active");
  }

  setActive(regionId, mesh = null) {
    const prevActive = this.activeMesh;
    this.activeId = regionId || null;

    if (mesh) {
      this.selectedMeshes.add(mesh);
      this.activeMesh = mesh;
      if (prevActive && prevActive !== mesh) this._restyleMesh(prevActive);
      this._applyMeshStyle(mesh, "active");
      return;
    }

    // External / 2D select: paint all meshes in region, keep prior selections
    const list = this.byRegion.get(regionId) || [];
    const inRegion = this.clickable.filter((m) => m.userData.regionId === regionId);
    const targets = list.length ? list : inRegion;
    for (const m of targets) this.selectedMeshes.add(m);
    this.activeMesh = targets[0] || null;
    for (const m of this.selectedMeshes) this._restyleMesh(m);
  }

  /** Clear kept selection colors (e.g. when session is cleared). */
  clearSelectionColors() {
    for (const m of this.selectedMeshes) this._applyMeshStyle(m, "idle");
    this.selectedMeshes.clear();
    this.activeMesh = null;
    this.activeId = null;
    if (this.hoverMesh) this._applyMeshStyle(this.hoverMesh, "hover");
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
    this.renderer.domElement.removeEventListener("pointerdown", this._onPointerDown);
    this.renderer.domElement.removeEventListener("pointermove", this._onPointerMove);
    this.renderer.domElement.removeEventListener("pointerleave", this._onPointerLeave);
    this.renderer.domElement.removeEventListener("click", this._onClick);
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.clickable = [];
    this.byRegion.clear();
    this.selectedMeshes.clear();
  }
}

export function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}
