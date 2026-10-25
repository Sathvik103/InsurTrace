'use client';

/**
 * A rotatable 3D car built from simple shapes, where each damageable part is
 * its own mesh. Click a part to toggle it; drag to turn the car.
 * Loaded only on the damage step (see DamagePicker), so three.js never ships
 * with other pages.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { DAMAGE_PARTS } from '@/lib/claimCheck';
import type { BodyType } from '@/lib/bodyType';

type PartId = 'front_bumper' | 'headlights' | 'bonnet' | 'windshield' | 'front_door' | 'rear_door' | 'side_mirror' | 'fender' | 'boot' | 'rear_bumper';
const LABEL = Object.fromEntries(DAMAGE_PARTS.map((p) => [p.id, p.label])) as Record<string, string>;

// Proportions per body style, in metres-ish units. The front of the car points to +x.
interface Dims {
  len: number;
  wid: number;
  sill: number; // bottom of the body
  belt: number; // top of the doors / bonnet line
  roof: number;
  cabFront: number; // x where the windscreen starts at the belt line
  cabRear: number; // x where the rear glass meets the belt line
  wsRun: number; // horizontal run of the windscreen slope
  rearRun: number; // horizontal run of the rear glass slope
  boot: boolean; // a separate boot lid (three-box) or a hatch
}
const DIMS: Record<BodyType, Dims> = {
  hatchback: { len: 3.85, wid: 1.7, sill: 0.32, belt: 0.9, roof: 1.5, cabFront: 0.62, cabRear: -1.62, wsRun: 0.62, rearRun: 0.18, boot: false },
  sedan: { len: 4.45, wid: 1.74, sill: 0.3, belt: 0.88, roof: 1.45, cabFront: 0.78, cabRear: -1.2, wsRun: 0.68, rearRun: 0.5, boot: true },
  suv: { len: 4.3, wid: 1.82, sill: 0.42, belt: 1.05, roof: 1.68, cabFront: 0.7, cabRear: -1.85, wsRun: 0.55, rearRun: 0.12, boot: false },
  mpv: { len: 4.6, wid: 1.8, sill: 0.34, belt: 0.95, roof: 1.72, cabFront: 1.0, cabRear: -2.05, wsRun: 0.75, rearRun: 0.1, boot: false },
  van: { len: 3.9, wid: 1.5, sill: 0.32, belt: 0.95, roof: 1.85, cabFront: 1.45, cabRear: -1.9, wsRun: 0.35, rearRun: 0.02, boot: false },
  pickup: { len: 5.0, wid: 1.8, sill: 0.45, belt: 1.0, roof: 1.72, cabFront: 1.0, cabRear: -0.35, wsRun: 0.5, rearRun: 0.05, boot: true },
  minitruck: { len: 3.8, wid: 1.5, sill: 0.4, belt: 1.0, roof: 1.75, cabFront: 1.8, cabRear: 0.9, wsRun: 0.15, rearRun: 0.0, boot: true },
};

const SELECTED = new THREE.Color('#a8432a');
const HOVER = new THREE.Color('#d9a441');

/** A box with softly rounded edges, so panels read as car body rather than blocks. */
function box(w: number, h: number, d: number) {
  const r = Math.min(0.06, w / 4, h / 4, d / 4);
  return new RoundedBoxGeometry(w, h, d, 3, r);
}

/** Builds the car; returns the group and the clickable meshes. */
function buildCar(type: BodyType, paint: string) {
  const d = DIMS[type];
  const group = new THREE.Group();
  const parts: THREE.Mesh[] = [];
  const half = d.len / 2;
  const hw = d.wid / 2;
  const bodyH = d.belt - d.sill;

  const paintMat = () => new THREE.MeshStandardMaterial({ color: paint, roughness: 0.42, metalness: 0.25 });
  const add = (geo: THREE.BufferGeometry, x: number, y: number, z: number, part?: PartId, mat?: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat ?? paintMat());
    m.position.set(x, y, z);
    m.castShadow = true;
    if (part) {
      m.userData.part = part;
      m.userData.base = (m.material as THREE.MeshStandardMaterial).color.clone();
      parts.push(m);
    }
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: '#141310', transparent: true, opacity: 0.22 }));
    m.add(edges);
    group.add(m);
    return m;
  };

  const bumperLen = 0.28;
  const midY = d.sill + bodyH / 2;
  const doorSplit = (d.cabFront + d.cabRear) / 2;
  const panel = 0.08; // thickness of door skins

  // Core volume (not clickable), slightly inset so the panels sit on its surface.
  add(box(d.len - bumperLen * 2, bodyH, d.wid - panel * 2), 0, midY, 0, undefined, new THREE.MeshStandardMaterial({ color: paint, roughness: 0.6 }));

  // Bumpers
  add(box(bumperLen, bodyH * 0.62, d.wid), half - bumperLen / 2, d.sill + bodyH * 0.31, 0, 'front_bumper', new THREE.MeshStandardMaterial({ color: '#2a2925', roughness: 0.7 }));
  add(box(bumperLen, bodyH * 0.62, d.wid), -half + bumperLen / 2, d.sill + bodyH * 0.31, 0, 'rear_bumper', new THREE.MeshStandardMaterial({ color: '#2a2925', roughness: 0.7 }));

  // Bonnet: top cap from windscreen base to the front bumper
  const bonnetLen = half - bumperLen - d.cabFront;
  if (bonnetLen > 0.1) add(box(bonnetLen + bumperLen * 0.6, 0.07, d.wid - 0.02), d.cabFront + (bonnetLen + bumperLen * 0.6) / 2, d.belt + 0.03, 0, 'bonnet');

  // Boot lid (three-box) or tailgate (hatch)
  const bootLen = d.cabRear - (-half + bumperLen);
  if (d.boot && bootLen > 0.1) {
    add(box(bootLen + bumperLen * 0.6, 0.07, d.wid - 0.02), -half + bumperLen * 0.4 + (bootLen + bumperLen * 0.6) / 2, d.belt + 0.03, 0, 'boot');
  } else {
    add(box(0.07, bodyH * 0.9, d.wid - 0.1), -half + bumperLen + 0.04, midY + 0.05, 0, 'boot');
  }

  // Side panels: front door, rear door, rear quarter (fender), both sides
  for (const side of [1, -1]) {
    const z = side * (hw - panel / 2);
    add(box(d.cabFront - doorSplit, bodyH * 0.92, panel), (d.cabFront + doorSplit) / 2, midY + 0.02, z, 'front_door');
    if (type !== 'pickup' && type !== 'minitruck') add(box(doorSplit - d.cabRear, bodyH * 0.92, panel), (doorSplit + d.cabRear) / 2, midY + 0.02, z, 'rear_door');
    const qStart = d.cabRear;
    const qEnd = -half + bumperLen;
    if (qStart - qEnd > 0.1) add(box(qStart - qEnd, bodyH * 0.92, panel), (qStart + qEnd) / 2, midY + 0.02, z, 'fender');
    // Headlight and tail light
    add(box(0.06, 0.12, 0.38), half - 0.02, d.belt - 0.12, side * (hw - 0.3), 'headlights', new THREE.MeshStandardMaterial({ color: '#f6f1d3', emissive: '#7a6a2a', emissiveIntensity: 0.4 }));
    add(box(0.05, 0.1, 0.3), -half + 0.02, d.belt - 0.12, side * (hw - 0.28), undefined, new THREE.MeshStandardMaterial({ color: '#b3261e', emissive: '#4a0d0a' }));
    // Mirror
    add(box(0.16, 0.1, 0.16), d.cabFront - 0.12, d.belt + 0.12, side * (hw + 0.07), 'side_mirror');
  }

  // Cabin: the glasshouse as one extruded profile, plus a roof cap and the windscreen.
  const shape = new THREE.Shape();
  shape.moveTo(d.cabFront, d.belt);
  shape.lineTo(d.cabFront - d.wsRun, d.roof);
  shape.lineTo(d.cabRear + d.rearRun, d.roof);
  shape.lineTo(d.cabRear, d.belt);
  shape.closePath();
  const cabinW = d.wid - 0.16;
  const cabinGeo = new THREE.ExtrudeGeometry(shape, { depth: cabinW, bevelEnabled: false });
  cabinGeo.translate(0, 0, -cabinW / 2);
  add(cabinGeo, 0, 0, 0, undefined, new THREE.MeshStandardMaterial({ color: '#2c3230', roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.88 }));
  const roofLen = d.cabFront - d.wsRun - (d.cabRear + d.rearRun);
  add(box(roofLen, 0.05, cabinW + 0.02), (d.cabFront - d.wsRun + d.cabRear + d.rearRun) / 2, d.roof + 0.025, 0);

  // Windscreen: a thin slab along the front slope
  const wsLen = Math.hypot(d.wsRun, d.roof - d.belt);
  const ws = add(box(wsLen, 0.03, cabinW - 0.04), d.cabFront - d.wsRun / 2 + 0.01, (d.belt + d.roof) / 2 + 0.01, 0, 'windshield', new THREE.MeshStandardMaterial({ color: '#5d6c66', roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.9 }));
  ws.rotation.z = -Math.atan2(d.roof - d.belt, d.wsRun) + Math.PI;

  // Pickup bed / mini-truck cargo box (not clickable beyond the rear parts)
  if (type === 'pickup' || type === 'minitruck') {
    const bedFront = d.cabRear;
    const bedRear = -half + bumperLen;
    add(box(bedFront - bedRear, 0.35, d.wid - 0.05), (bedFront + bedRear) / 2, d.belt + 0.17, 0, undefined, new THREE.MeshStandardMaterial({ color: paint, roughness: 0.5, side: THREE.BackSide }));
  }

  // Wheels
  const wheelR = type === 'minitruck' ? 0.3 : type === 'suv' || type === 'pickup' ? 0.38 : 0.34;
  const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.24, 28);
  wheelGeo.rotateX(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(wheelR * 0.55, wheelR * 0.55, 0.26, 20);
  hubGeo.rotateX(Math.PI / 2);
  const axleF = half - bumperLen - 0.55;
  const axleR = -half + bumperLen + 0.6;
  for (const x of [axleF, axleR]) {
    for (const side of [1, -1]) {
      const w = new THREE.Mesh(wheelGeo, new THREE.MeshStandardMaterial({ color: '#1b1e1d', roughness: 0.9 }));
      w.position.set(x, wheelR, side * (hw - 0.1));
      w.add(new THREE.Mesh(hubGeo, new THREE.MeshStandardMaterial({ color: '#b8bcb6', metalness: 0.6, roughness: 0.35 })));
      group.add(w);
    }
  }

  return { group, parts };
}

function softShadow() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(20,19,16,0.38)');
  grad.addColorStop(1, 'rgba(20,19,16,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.01;
  return plane;
}

const VIEWS = {
  'Three-quarter': { yaw: 0.75, pitch: 0.38 },
  Front: { yaw: 0, pitch: 0.2 },
  Side: { yaw: Math.PI / 2, pitch: 0.15 },
  Rear: { yaw: Math.PI, pitch: 0.2 },
  Top: { yaw: Math.PI / 2, pitch: 1.45 },
} as const;
type ViewName = keyof typeof VIEWS;

export default function Car3D({ type, paint, selected, onToggle }: { type: BodyType; paint: string; selected: Set<string>; onToggle: (id: string) => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const api = useRef<{ setView: (v: ViewName) => void; setSelected: (s: Set<string>) => void } | null>(null);
  const onToggleRef = useRef(onToggle);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [view, setViewName] = useState<ViewName>('Three-quarter');

  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#fffaf0', '#8a8272', 1.6));
    const sun = new THREE.DirectionalLight('#ffffff', 1.6);
    sun.position.set(4, 7, 3);
    scene.add(sun);
    scene.add(softShadow());

    const { group, parts } = buildCar(type, paint);
    scene.add(group);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    // Current camera angles, and the targets they ease towards.
    const start = VIEWS['Three-quarter'];
    const orbit: { yaw: number; pitch: number; ty: number; tp: number; r: number } = { yaw: start.yaw, pitch: start.pitch, ty: start.yaw, tp: start.pitch, r: 8.2 };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      orbit.r = w < 420 ? 10.5 : 8.2;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let selectedSet = new Set<string>();
    let hovered: string | null = null;
    const paintParts = () => {
      for (const m of parts) {
        const id = m.userData.part as string;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.color.copy(selectedSet.has(id) ? SELECTED : hovered === id ? (m.userData.base as THREE.Color).clone().lerp(HOVER, 0.55) : m.userData.base);
      }
    };

    // Pointer: drag turns the car, a short press toggles the part under it.
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down: { x: number; y: number; yaw: number; pitch: number } | null = null;
    let moved = false;
    const partAt = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(parts, false)[0];
      return hit ? (hit.object.userData.part as string) : null;
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, yaw: orbit.ty, pitch: orbit.tp };
      moved = false;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (down) {
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
        orbit.ty = down.yaw - dx * 0.008;
        orbit.tp = Math.min(1.45, Math.max(0.05, down.pitch + dy * 0.006));
      }
      const id = partAt(e);
      if (id !== hovered) {
        hovered = id;
        paintParts();
        renderer.domElement.style.cursor = id ? 'pointer' : down ? 'grabbing' : 'grab';
      }
      const r = el.getBoundingClientRect();
      setHover(id && !down ? { id, x: e.clientX - r.left, y: e.clientY - r.top } : null);
    };
    const onUp = (e: PointerEvent) => {
      if (down && !moved) {
        const id = partAt(e);
        if (id) onToggleRef.current(id);
      }
      down = null;
    };
    const onLeave = () => {
      hovered = null;
      paintParts();
      setHover(null);
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointerleave', onLeave);

    api.current = {
      setView: (v) => {
        // Turn the short way round.
        const target = VIEWS[v].yaw;
        const turns = Math.round((orbit.ty - target) / (2 * Math.PI));
        orbit.ty = target + turns * 2 * Math.PI;
        orbit.tp = VIEWS[v].pitch;
      },
      setSelected: (s) => {
        selectedSet = s;
        paintParts();
      },
    };

    let raf = 0;
    const tick = () => {
      const k = reduce ? 1 : 0.12;
      orbit.yaw += (orbit.ty - orbit.yaw) * k;
      orbit.pitch += (orbit.tp - orbit.pitch) * k;
      const cp = Math.cos(orbit.pitch);
      camera.position.set(orbit.r * cp * Math.cos(orbit.yaw), orbit.r * Math.sin(orbit.pitch) + 0.2, orbit.r * cp * Math.sin(orbit.yaw));
      camera.lookAt(0, 0.7, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
        }
      });
      renderer.dispose();
      el.removeChild(renderer.domElement);
      api.current = null;
    };
  }, [type, paint]);

  useEffect(() => {
    api.current?.setSelected(selected);
  }, [selected, type, paint]);

  return (
    <div className="space-y-3">
      <div ref={mount} className="relative h-72 w-full cursor-grab overflow-hidden rounded-xl bg-paper sm:h-80" role="application" aria-label="3D car. Drag to turn it, tap a part to mark it damaged.">
        {hover && (
          <span className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-ink-950 px-2 py-1 text-xs font-medium text-white" style={{ left: hover.x, top: hover.y - 10 }}>
            {LABEL[hover.id]}
            {selected.has(hover.id) ? ' · selected' : ''}
          </span>
        )}
        <span className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-ink-400">Drag to turn · tap a part</span>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Camera">
        {(Object.keys(VIEWS) as ViewName[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setViewName(v);
              api.current?.setView(v);
            }}
            aria-pressed={view === v}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${view === v ? 'bg-ink-950 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
