import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Room, Variant } from '../types';
import { computeWallPanels } from '../lib/room3d';
import { fillFloorSurface } from '../lib/texture';
import { resolveFloorSelection, resolveMaterial, resolveWallColorHex } from '../lib/materialResolve';
import { useT } from '../hooks';

/**
 * 3D-Raumansicht (three.js) — additiv neben Technisch & Realistisch.
 * Extrudiert Wände aus dem Grundriss, lässt Tür-/Fenster-Öffnungen frei,
 * legt das gewählte Bodenmaterial/Verlegemuster als Textur auf den Boden.
 * Komplett offline (three.js lokal gebündelt). Orbit per Maus/Touch.
 */
export function Room3D({
  room,
  variant,
  width = 560,
  height = 380,
}: {
  room: Room;
  variant: Variant;
  width?: number;
  height?: number;
}) {
  const t = useT();
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const pts = room.floorplan.points;
    if (pts.length < 3) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // S7a: korrekter Ausgabe-Farbraum + filmisches Tone-Mapping (satte, echte Farben).
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#EDEAE2');

    // ── Maßstab & Zentrierung (Meter) ──
    const xs = pts.map((p) => p.x / 100);
    const zs = pts.map((p) => p.y / 100);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
    const Hm = room.heightCm / 100;
    // map: Grundriss (cm) → Weltkoordinaten (m), Boden auf y=0
    const mapX = (xcm: number) => xcm / 100 - cx;
    const mapZ = (ycm: number) => -(ycm / 100 - cz);

    const disposables: { dispose: () => void }[] = [];

    // ── Kamera ──
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(span * 0.9, span * 1.0 + Hm, span * 1.1);

    // ── Licht ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xfff4e0, 0.9);
    dir.position.set(span, span * 2 + 2, span * 0.6);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xdfe6ff, 0.35);
    fill.position.set(-span, span, -span);
    scene.add(fill);

    // ── Boden mit Material/Verlegemuster ──
    const shape = new THREE.Shape();
    pts.forEach((p, i) => {
      const X = mapX(p.x);
      const Z = mapZ(p.y);
      // Shape liegt in XY; nach rotateX(-90°) wird Y→Z. Damit es zu mapZ passt: Y = -Z.
      if (i === 0) shape.moveTo(X, -Z);
      else shape.lineTo(X, -Z);
    });
    const floorGeo = new THREE.ShapeGeometry(shape);
    floorGeo.rotateX(-Math.PI / 2);
    disposables.push(floorGeo);

    const floorSel = resolveFloorSelection(variant);
    const floorMat = resolveMaterial(floorSel);
    let floorMaterial: THREE.Material;
    if (floorMat) {
      const pxPerM = 48;
      const cw = Math.min(2048, Math.max(256, Math.round(span * pxPerM)));
      const cnv = document.createElement('canvas');
      cnv.width = cw;
      cnv.height = cw;
      const ctx = cnv.getContext('2d');
      if (ctx) {
        // Gemeinsame, korrekte Material-Darstellung (identisch zu 2D & Katalog-Kachel).
        fillFloorSurface(ctx, { minX: 0, minY: 0, maxX: cw, maxY: cw }, pxPerM, {
          texture: floorMat.texture,
          pattern: floorSel?.pattern,
          direction: floorSel?.layingDirection,
          groutColor: floorSel?.groutColor,
        });
      }
      const tex = new THREE.CanvasTexture(cnv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const minXm = Math.min(...xs);
      const minZm = Math.min(...zs);
      const spanX = Math.max(0.01, Math.max(...xs) - minXm);
      const spanZ = Math.max(0.01, Math.max(...zs) - minZm);
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(1 / spanX, 1 / spanZ);
      tex.offset.set(-(minXm - cx) / spanX, -(minZm - cz) / spanZ);
      tex.needsUpdate = true;
      disposables.push(tex);
      floorMaterial = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.02 });
    } else {
      floorMaterial = new THREE.MeshStandardMaterial({ color: '#D9D2C4', roughness: 0.9 });
    }
    disposables.push(floorMaterial);
    scene.add(new THREE.Mesh(floorGeo, floorMaterial));

    // ── Wände (pro Wand Farbe; Öffnungen ausgespart) ──
    const wallThickness = 0.1;
    for (let i = 0; i < pts.length; i++) {
      const A = { x: mapX(pts[i].x), z: mapZ(pts[i].y) };
      const B = { x: mapX(pts[(i + 1) % pts.length].x), z: mapZ(pts[(i + 1) % pts.length].y) };
      const ex = B.x - A.x;
      const ez = B.z - A.z;
      const len = Math.hypot(ex, ez) || 1;
      const ux = ex / len;
      const uz = ez / len;
      const angle = Math.atan2(-ez, ex);
      const colorHex = resolveWallColorHex(variant, i);
      const wallMaterial = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.9 });
      disposables.push(wallMaterial);

      const panels = computeWallPanels(room.floorplan, i, room.heightCm);
      for (const p of panels) {
        const w = (p.x1 - p.x0) / 100;
        const h = (p.y1 - p.y0) / 100;
        if (w <= 0 || h <= 0) continue;
        const along = (p.x0 + p.x1) / 200; // m vom Wandanfang
        const geo = new THREE.BoxGeometry(w, h, wallThickness);
        disposables.push(geo);
        const mesh = new THREE.Mesh(geo, wallMaterial);
        mesh.position.set(A.x + ux * along, (p.y0 + p.y1) / 200, A.z + uz * along);
        mesh.rotation.y = angle;
        scene.add(mesh);
      }
    }

    // ── Steuerung ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, Hm / 2, 0);
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = span * 0.4;
    controls.maxDistance = span * 4 + 4;
    controls.update();

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [room, variant, width, height]);

  if (failed) {
    return (
      <div className="board-surface rounded flex items-center justify-center" style={{ width, height }}>
        <p className="text-[#6b6256] text-sm px-6 text-center">{t('plan.no3d')}</p>
      </div>
    );
  }
  return <div ref={mountRef} data-testid="room-3d" style={{ width, height }} role="img" aria-label="3D-Raumansicht" />;
}

