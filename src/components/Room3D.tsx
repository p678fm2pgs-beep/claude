import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Orientation, Room, Variant } from '../types';
import { computeWallPanels } from '../lib/room3d';
import { computeOpeningParts, type OpeningPartKind } from '../lib/openings3d';
import { fillFloorPattern } from '../lib/texture';
import { resolveFloorSelection, resolveMaterial, resolveWallColorHex } from '../lib/materialResolve';
import { useT } from '../hooks';

/** Himmelsrichtung → Azimut (Grad) für den Sonnenstand. */
const AZIMUTH: Record<Orientation, number> = { S: 0, SW: 45, W: 90, NW: 135, N: 180, NO: 225, O: 270, SO: 315 };

/**
 * 3D-Raumansicht (three.js) — additiv neben Technisch & Realistisch.
 * Erweiterung 5: Archviz-Pipeline (ACES-Tone-Mapping, IBL via RoomEnvironment, weiche
 * Sonnen-Schatten, PBR-Rauheit) + gefüllte Öffnungen (Fenster: Rahmen+Glas+Sprosse,
 * Türen: Zarge+Türblatt) — keine leeren Löcher mehr.
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
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Erweiterung 5 — Render-Pipeline: behebt flache, ausgewaschene Bildwirkung.
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#E7E3DA');

    // Image-Based Lighting (IBL): neutrales Studio-Environment, lokal generiert (offline).
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmrem.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTex;
    (roomEnv as unknown as { dispose?: () => void }).dispose?.();

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

    // ── Licht & weiche Schatten ──
    // Himmel/Boden-Füllung (kein „totes" Schwarz in Schatten).
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a4, 0.55));
    // Sonne mit weichen Schatten, Richtung aus der Raumausrichtung.
    const az = ((AZIMUTH[room.light.orientation] ?? 0) * Math.PI) / 180;
    const sun = new THREE.DirectionalLight(0xfff2dd, 2.6);
    const sunDist = span * 1.8 + 3;
    sun.position.set(Math.sin(az) * sunDist, span * 2.2 + Hm, Math.cos(az) * sunDist);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sr = span * 1.3 + 1;
    sun.shadow.camera.left = -sr;
    sun.shadow.camera.right = sr;
    sun.shadow.camera.top = sr;
    sun.shadow.camera.bottom = -sr;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = sunDist * 2 + span * 3;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.target.position.set(0, 0, 0);
    scene.add(sun);
    scene.add(sun.target);

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
      const isTile = floorMat.texture.variant === 'tile' || floorMat.texture.variant === 'stone';
      const pxPerM = 48;
      const cw = Math.min(2048, Math.max(256, Math.round(span * pxPerM)));
      const cnv = document.createElement('canvas');
      cnv.width = cw;
      cnv.height = cw;
      const ctx = cnv.getContext('2d');
      if (ctx) {
        fillFloorPattern(ctx, { minX: 0, minY: 0, maxX: cw, maxY: cw }, pxPerM, {
          pattern: floorSel?.pattern ?? 'gerade',
          direction: floorSel?.layingDirection,
          base: floorMat.texture.base,
          grain: floorMat.texture.grain ?? floorMat.texture.base,
          tile: isTile,
          groutColor: floorSel?.groutColor,
          unitM: isTile ? 0.6 : floorSel?.pattern === 'fischgraet' || floorSel?.pattern === 'chevron' ? 0.6 : 1.2,
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
      // Stein/Fliese dezent reflektierend, Holz matter — reagiert auf Licht/Environment.
      floorMaterial = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: isTile ? 0.4 : 0.62,
        metalness: 0.0,
        envMapIntensity: isTile ? 1.0 : 0.7,
      });
    } else {
      floorMaterial = new THREE.MeshStandardMaterial({ color: '#D9D2C4', roughness: 0.8 });
    }
    disposables.push(floorMaterial);
    const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // ── Wände (pro Wand Farbe; Öffnungen ausgespart) + gefüllte Öffnungen ──
    const wallThickness = 0.12;
    // Material-Cache für Öffnungsteile (Rahmen/Glas/Türblatt) je Farbe.
    const partMatCache = new Map<string, THREE.Material>();
    const partMaterial = (kind: OpeningPartKind, frameColor?: string): THREE.Material => {
      const key = `${kind}:${frameColor ?? ''}`;
      const cached = partMatCache.get(key);
      if (cached) return cached;
      let m: THREE.Material;
      if (kind === 'glass') {
        m = new THREE.MeshPhysicalMaterial({
          color: '#cfe0e6',
          roughness: 0.05,
          metalness: 0,
          transmission: 0.92,
          transparent: true,
          opacity: 0.55,
          thickness: 0.02,
          ior: 1.5,
          envMapIntensity: 1.2,
        });
      } else if (kind === 'leaf') {
        m = new THREE.MeshStandardMaterial({ color: frameColor ?? '#b98c5a', roughness: 0.55, metalness: 0.05 });
      } else {
        // frame / mullion
        m = new THREE.MeshStandardMaterial({ color: frameColor ?? '#2b2b2b', roughness: 0.5, metalness: 0.35 });
      }
      disposables.push(m);
      partMatCache.set(key, m);
      return m;
    };

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
      const wallMaterial = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.92, metalness: 0.0 });
      disposables.push(wallMaterial);

      const place = (mesh: THREE.Mesh, alongCm: number, yCm: number) => {
        const along = alongCm / 100;
        mesh.position.set(A.x + ux * along, yCm / 100, A.z + uz * along);
        mesh.rotation.y = angle;
        scene.add(mesh);
      };

      // Massive Wandstücke
      const panels = computeWallPanels(room.floorplan, i, room.heightCm);
      for (const p of panels) {
        const w = (p.x1 - p.x0) / 100;
        const h = (p.y1 - p.y0) / 100;
        if (w <= 0 || h <= 0) continue;
        const geo = new THREE.BoxGeometry(w, h, wallThickness);
        disposables.push(geo);
        const mesh = new THREE.Mesh(geo, wallMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        place(mesh, (p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2);
      }

      // Öffnungen dieser Wand mit echten Bauteilen füllen
      const wallLen = len * 100; // cm
      for (const o of room.floorplan.openings.filter((op) => op.wallIndex === i)) {
        const parts = computeOpeningParts(o, wallLen, room.heightCm);
        for (const part of parts) {
          const w = (part.x1 - part.x0) / 100;
          const h = (part.y1 - part.y0) / 100;
          if (w <= 0 || h <= 0) continue;
          const geo = new THREE.BoxGeometry(w, h, part.depthCm / 100);
          disposables.push(geo);
          const mesh = new THREE.Mesh(geo, partMaterial(part.kind, o.frameColor));
          if (part.kind !== 'glass') {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
          place(mesh, (part.x0 + part.x1) / 2, (part.y0 + part.y1) / 2);
        }
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
      envTex.dispose();
      pmrem.dispose();
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
