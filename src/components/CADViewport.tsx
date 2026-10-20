import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { useCADStore } from '../store/cadStore';
import { snapPointToGrid } from '../utils/snapping';
import { buildEntityGeometry } from '../cad/geometryBuilder';
import { create2DCurveEntity } from '../cad/primitiveFactory';

export type ViewportMode = '3D' | 'Top' | 'Front' | 'Right';

interface CADViewportProps {
  mode: ViewportMode;
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

export const CADViewport: React.FC<CADViewportProps> = ({
  mode,
  isMaximized,
  onToggleMaximize,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [gizmoMode, setGizmoMode] = useState<'translate' | 'rotate' | 'scale'>('translate');

  const entities = useCADStore((state) => state.entities);
  const selectedEntityIds = useCADStore((state) => state.selectedEntityIds);
  const selectionMode = useCADStore((state) => state.selectionMode);
  const selectedSubElement = useCADStore((state) => state.selectedSubElement);
  const selectEntity = useCADStore((state) => state.selectEntity);
  const selectSubElement = useCADStore((state) => state.selectSubElement);
  const updateEntityParameters = useCADStore((state) => state.updateEntityParameters);
  const addEntity = useCADStore((state) => state.addEntity);
  const activeTool = useCADStore((state) => state.activeTool);
  const setActiveTool = useCADStore((state) => state.setActiveTool);
  const snapping = useCADStore((state) => state.snapping);
  const setCursorCoords = useCADStore((state) => state.setCursorCoords);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const meshesMapRef = useRef<Map<string, THREE.Object3D>>(new Map());

  // Interactive drawing states
  const [drawPoints, setDrawPoints] = useState<Array<{ x: number; y: number; z: number }>>([]);
  const previewMeshRef = useRef<THREE.Object3D | null>(null);

  // Helper: get the plane corresponding to the viewport mode
  const getViewportPlane = useCallback(() => {
    if (mode === 'Top') {
      return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Y = 0
    } else if (mode === 'Front') {
      return new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Z = 0
    } else if (mode === 'Right') {
      return new THREE.Plane(new THREE.Vector3(1, 0, 0), 0); // X = 0
    }
    // 3D perspective ground plane
    return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }, [mode]);

  // Main setup effect
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#141417');
    sceneRef.current = scene;

    // Grid Helper & Axes Helper
    const gridHelper = new THREE.GridHelper(60, 60, '#3b82f6', '#2e3440');
    if (mode === 'Front') {
      gridHelper.rotation.x = Math.PI / 2;
    } else if (mode === 'Right') {
      gridHelper.rotation.z = Math.PI / 2;
    }
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(6);
    scene.add(axesHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight1.position.set(20, 35, 25);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(-20, -15, -20);
    scene.add(dirLight2);

    // Camera setup based on view mode
    let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    const aspect = width / height;
    const frustumSize = 35;

    if (mode === '3D') {
      camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
      camera.position.set(25, 25, 25);
      camera.lookAt(0, 0, 0);
    } else if (mode === 'Top') {
      camera = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
      );
      camera.position.set(0, 60, 0);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 0, -1);
    } else if (mode === 'Front') {
      camera = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
      );
      camera.position.set(0, 0, 60);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 1, 0);
    } else {
      // Right view
      camera = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
      );
      camera.position.set(60, 0, 0);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 1, 0);
    }
    cameraRef.current = camera;

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = mode === '3D';
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // TransformControls for direct 3D manipulation
    const tControls = new TransformControls(camera, renderer.domElement);
    transformControlsRef.current = tControls;
    tControls.size = 0.85;

    tControls.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value;
    });

    tControls.addEventListener('objectChange', () => {
      const obj = tControls.object;
      if (obj && obj.userData.entityId) {
        let pos = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
        if (snapping.gridSnap) {
          pos = snapPointToGrid(pos, snapping.gridSize);
        }
        updateEntityParameters(obj.userData.entityId, {
          posX: pos.x,
          posY: pos.y,
          posZ: pos.z,
          rotX: obj.rotation.x,
          rotY: obj.rotation.y,
          rotZ: obj.rotation.z,
        });
      }
    });

    const gizmoHelper = tControls.getHelper();
    scene.add(gizmoHelper);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      const newAspect = w / h;

      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = newAspect;
      } else if (camera instanceof THREE.OrthographicCamera) {
        camera.left = (-frustumSize * newAspect) / 2;
        camera.right = (frustumSize * newAspect) / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(mountRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      tControls.dispose();
      if (rendererRef.current?.domElement) {
        rendererRef.current.domElement.remove();
        rendererRef.current.dispose();
      }
    };
  }, [mode]);

  // Update Transform Controls gizmo mode
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(gizmoMode);
    }
  }, [gizmoMode]);

  // Pointer position raycaster to find world coordinates on the working plane
  const getPlaneIntersection = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): { x: number; y: number; z: number } | null => {
      if (!mountRef.current || !cameraRef.current) return null;
      const rect = mountRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const plane = getViewportPlane();
      const target = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(plane, target);

      if (hit) {
        let pt = { x: target.x, y: target.y, z: target.z };
        if (snapping.gridSnap) {
          pt = snapPointToGrid(pt, snapping.gridSize);
        }
        return pt;
      }
      return null;
    },
    [getViewportPlane, snapping]
  );

  // Mouse move handler for live coordinates and interactive curve drawing preview
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const pt = getPlaneIntersection(e);
    if (!pt) return;

    // Update global status bar coordinates
    setCursorCoords({
      x: Number(pt.x.toFixed(2)),
      y: Number(pt.y.toFixed(2)),
      z: Number(pt.z.toFixed(2)),
    });

    const isDrawingTool = ['line', 'polyline', 'circle', 'rectangle'].includes(activeTool);
    if (!isDrawingTool || drawPoints.length === 0 || !sceneRef.current) return;

    // Clear previous preview
    if (previewMeshRef.current) {
      sceneRef.current.remove(previewMeshRef.current);
      previewMeshRef.current = null;
    }

    const p1 = drawPoints[0];
    const p2 = pt;

    // Draw dynamic live rubberband preview
    if (activeTool === 'line') {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p1.x, p1.y, p1.z),
        new THREE.Vector3(p2.x, p2.y, p2.z),
      ]);
      const mat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 1,
        gapSize: 0.5,
      });
      const line = new THREE.Line(geom, mat);
      line.computeLineDistances();
      sceneRef.current.add(line);
      previewMeshRef.current = line;
    } else if (activeTool === 'circle') {
      const radius = Math.hypot(p2.x - p1.x, p2.z - p1.z || p2.y - p1.y);
      const curve = new THREE.EllipseCurve(
        0, 0,
        radius, radius,
        0, 2 * Math.PI,
        false, 0
      );
      const pts = curve.getPoints(50);
      const geom = new THREE.BufferGeometry().setFromPoints(
        pts.map((p) => new THREE.Vector3(p.x, 0.05, p.y))
      );
      const mat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
      const circleMesh = new THREE.LineLoop(geom, mat);
      circleMesh.position.set(p1.x, p1.y, p1.z);
      sceneRef.current.add(circleMesh);
      previewMeshRef.current = circleMesh;
    } else if (activeTool === 'rectangle') {
      // 4 corners on the working plane
      const points = [
        new THREE.Vector3(p1.x, p1.y, p1.z),
        new THREE.Vector3(p2.x, p1.y, p1.z),
        new THREE.Vector3(p2.x, p2.y, p2.z),
        new THREE.Vector3(p1.x, p2.y, p2.z),
        new THREE.Vector3(p1.x, p1.y, p1.z),
      ];
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
      const rectMesh = new THREE.Line(geom, mat);
      sceneRef.current.add(rectMesh);
      previewMeshRef.current = rectMesh;
    } else if (activeTool === 'polyline') {
      const points = [...drawPoints, p2].map((p) => new THREE.Vector3(p.x, p.y, p.z));
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
      const polyMesh = new THREE.Line(geom, mat);
      sceneRef.current.add(polyMesh);
      previewMeshRef.current = polyMesh;
    }
  };

  // Click handler: either interactive drawing or object selection
  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const isDrawingTool = ['line', 'polyline', 'circle', 'rectangle'].includes(activeTool);

    if (isDrawingTool) {
      const pt = getPlaneIntersection(e);
      if (!pt) return;

      if (activeTool === 'line') {
        if (drawPoints.length === 0) {
          setDrawPoints([pt]);
        } else {
          // Complete line
          const p1 = drawPoints[0];
          addEntity(
            create2DCurveEntity('line', {
              points: [p1, pt],
              closed: false,
            })
          );
          setDrawPoints([]);
          if (previewMeshRef.current && sceneRef.current) {
            sceneRef.current.remove(previewMeshRef.current);
            previewMeshRef.current = null;
          }
          setActiveTool('select');
        }
      } else if (activeTool === 'rectangle') {
        if (drawPoints.length === 0) {
          setDrawPoints([pt]);
        } else {
          const p1 = drawPoints[0];
          const points = [
            p1,
            { x: pt.x, y: p1.y, z: p1.z },
            pt,
            { x: p1.x, y: pt.y, z: pt.z },
          ];
          addEntity(
            create2DCurveEntity('rectangle', {
              points,
              closed: true,
              width: Math.abs(pt.x - p1.x),
              height: Math.abs(pt.z - p1.z || pt.y - p1.y),
            })
          );
          setDrawPoints([]);
          if (previewMeshRef.current && sceneRef.current) {
            sceneRef.current.remove(previewMeshRef.current);
            previewMeshRef.current = null;
          }
          setActiveTool('select');
        }
      } else if (activeTool === 'circle') {
        if (drawPoints.length === 0) {
          setDrawPoints([pt]);
        } else {
          const p1 = drawPoints[0];
          const radius = Math.max(1, Math.hypot(pt.x - p1.x, pt.z - p1.z || pt.y - p1.y));
          addEntity(
            create2DCurveEntity('circle', {
              points: [p1],
              radius: Number(radius.toFixed(2)),
              closed: true,
            })
          );
          setDrawPoints([]);
          if (previewMeshRef.current && sceneRef.current) {
            sceneRef.current.remove(previewMeshRef.current);
            previewMeshRef.current = null;
          }
          setActiveTool('select');
        }
      } else if (activeTool === 'polyline') {
        // Double click or multi-click
        if (e.detail === 2 || (drawPoints.length > 2 && Math.hypot(pt.x - drawPoints[0].x, pt.z - drawPoints[0].z) < 1)) {
          // Finish polyline
          addEntity(
            create2DCurveEntity('polyline', {
              points: [...drawPoints, pt],
              closed: false,
            })
          );
          setDrawPoints([]);
          if (previewMeshRef.current && sceneRef.current) {
            sceneRef.current.remove(previewMeshRef.current);
            previewMeshRef.current = null;
          }
          setActiveTool('select');
        } else {
          setDrawPoints((prev) => [...prev, pt]);
        }
      }
      return;
    }

    // Default: Selection raycaster
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const cadMeshes: THREE.Object3D[] = [];
    sceneRef.current.children.forEach((child) => {
      if (child.userData?.isCADEntity) {
        cadMeshes.push(child);
      }
    });

    const intersects = raycaster.intersectObjects(cadMeshes, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      let hitObj: THREE.Object3D | null = hit.object;
      while (hitObj && !hitObj.userData?.entityId) {
        hitObj = hitObj.parent;
      }

      if (hitObj && hitObj.userData.entityId) {
        selectEntity(hitObj.userData.entityId, e.shiftKey);

        if (selectionMode === 'vertex') {
          if (hit.object instanceof THREE.Mesh && hit.object.geometry) {
            const geom = hit.object.geometry;
            const posAttr = geom.attributes.position;
            let closestIdx = 0;
            let minDist = Infinity;
            const v = new THREE.Vector3();
            for (let i = 0; i < posAttr.count; i++) {
              v.fromBufferAttribute(posAttr, i);
              v.applyMatrix4(hit.object.matrixWorld);
              const d = v.distanceTo(hit.point);
              if (d < minDist) {
                minDist = d;
                closestIdx = i;
              }
            }
            v.fromBufferAttribute(posAttr, closestIdx);
            v.applyMatrix4(hit.object.matrixWorld);
            selectSubElement({
              entityId: hitObj.userData.entityId,
              subType: 'vertex',
              index: closestIdx,
              data: { point: { x: Number(v.x.toFixed(2)), y: Number(v.y.toFixed(2)), z: Number(v.z.toFixed(2)) } },
            });
          }
        } else if (selectionMode === 'edge') {
          if (hit.object instanceof THREE.Mesh && hit.object.geometry && hit.face) {
            const geom = hit.object.geometry;
            const posAttr = geom.attributes.position;
            const pA = new THREE.Vector3().fromBufferAttribute(posAttr, hit.face.a).applyMatrix4(hit.object.matrixWorld);
            const pB = new THREE.Vector3().fromBufferAttribute(posAttr, hit.face.b).applyMatrix4(hit.object.matrixWorld);
            const pC = new THREE.Vector3().fromBufferAttribute(posAttr, hit.face.c).applyMatrix4(hit.object.matrixWorld);

            const lineAB = new THREE.Line3(pA, pB);
            const lineBC = new THREE.Line3(pB, pC);
            const lineCA = new THREE.Line3(pC, pA);

            const ptAB = new THREE.Vector3();
            const ptBC = new THREE.Vector3();
            const ptCA = new THREE.Vector3();

            lineAB.closestPointToPoint(hit.point, true, ptAB);
            lineBC.closestPointToPoint(hit.point, true, ptBC);
            lineCA.closestPointToPoint(hit.point, true, ptCA);

            const distAB = ptAB.distanceTo(hit.point);
            const distBC = ptBC.distanceTo(hit.point);
            const distCA = ptCA.distanceTo(hit.point);

            let edgePoints: [THREE.Vector3, THREE.Vector3] = [pA, pB];
            let edgeSubIdx = 0;

            if (distBC < distAB && distBC < distCA) {
              edgePoints = [pB, pC];
              edgeSubIdx = 1;
            } else if (distCA < distAB && distCA < distBC) {
              edgePoints = [pC, pA];
              edgeSubIdx = 2;
            }

            selectSubElement({
              entityId: hitObj.userData.entityId,
              subType: 'edge',
              index: (hit.faceIndex ?? 0) * 3 + edgeSubIdx,
              data: {
                edgePoints: [
                  { x: Number(edgePoints[0].x.toFixed(2)), y: Number(edgePoints[0].y.toFixed(2)), z: Number(edgePoints[0].z.toFixed(2)) },
                  { x: Number(edgePoints[1].x.toFixed(2)), y: Number(edgePoints[1].y.toFixed(2)), z: Number(edgePoints[1].z.toFixed(2)) },
                ],
              },
            });
          }
        } else if (selectionMode === 'face') {
          if (hit.faceIndex !== undefined && hit.faceIndex !== null) {
            selectSubElement({
              entityId: hitObj.userData.entityId,
              subType: 'face',
              index: hit.faceIndex,
              data: {
                faceNormal: hit.face?.normal
                  ? { x: Number(hit.face.normal.x.toFixed(2)), y: Number(hit.face.normal.y.toFixed(2)), z: Number(hit.face.normal.z.toFixed(2)) }
                  : undefined,
              },
            });
          }
        } else {
          selectSubElement(null);
        }
      }
    } else {
      if (!transformControlsRef.current?.dragging) {
        selectEntity(null);
        selectSubElement(null);
      }
    }
  };

  // Re-render CAD Entities inside scene
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const tControls = transformControlsRef.current;

    // Remove existing entity meshes
    const toRemove: THREE.Object3D[] = [];
    scene.children.forEach((child) => {
      if (child.userData?.isCADEntity) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((obj) => scene.remove(obj));
    meshesMapRef.current.clear();

    const entitiesMap = new Map<string, any>();
    entities.forEach((ent) => entitiesMap.set(ent.id, ent));

    // Render entities
    entities.forEach((entity) => {
      if (!entity.visible) return;

      const isSelected = selectedEntityIds.includes(entity.id);
      const baseColor = isSelected ? '#f59e0b' : entity.color || '#3b82f6';

      let obj: THREE.Object3D;

      if (entity.type === 'curve') {
        // Curve rendering
        const group = new THREE.Group();
        const pts = entity.parameters.points || [];

        if (entity.subType === 'circle') {
          const r = entity.parameters.radius || 5;
          const curve = new THREE.EllipseCurve(0, 0, r, r, 0, 2 * Math.PI, false, 0);
          const circlePts = curve.getPoints(64);
          const geom = new THREE.BufferGeometry().setFromPoints(
            circlePts.map((p) => new THREE.Vector3(p.x, 0, p.y))
          );
          const lineMat = new THREE.LineBasicMaterial({
            color: new THREE.Color(baseColor),
            linewidth: isSelected ? 3 : 2,
          });
          const line = new THREE.LineLoop(geom, lineMat);
          group.add(line);

          // Translucent clickable disc
          const discGeom = new THREE.CircleGeometry(r, 32);
          discGeom.rotateX(-Math.PI / 2);
          const discMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(baseColor),
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
          });
          group.add(new THREE.Mesh(discGeom, discMat));
        } else if (entity.subType === 'rectangle') {
          const curvePts = (pts.length >= 4 ? pts : [
            { x: -5, y: 0, z: -5 },
            { x: 5, y: 0, z: -5 },
            { x: 5, y: 0, z: 5 },
            { x: -5, y: 0, z: 5 },
          ]).map((p: any) => new THREE.Vector3(p.x, p.y ?? 0, p.z));

          const geom = new THREE.BufferGeometry().setFromPoints(curvePts);
          const lineMat = new THREE.LineBasicMaterial({
            color: new THREE.Color(baseColor),
            linewidth: isSelected ? 3 : 2,
          });
          const line = new THREE.LineLoop(geom, lineMat);
          group.add(line);

          // Translucent plane fill
          const shape = new THREE.Shape();
          shape.moveTo(curvePts[0].x, curvePts[0].z);
          for (let i = 1; i < curvePts.length; i++) {
            shape.lineTo(curvePts[i].x, curvePts[i].z);
          }
          shape.closePath();
          const planeGeom = new THREE.ShapeGeometry(shape);
          planeGeom.rotateX(-Math.PI / 2);
          const planeMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(baseColor),
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
          });
          group.add(new THREE.Mesh(planeGeom, planeMat));
        } else {
          // Line or Polyline
          const vecPts = (pts.length > 0 ? pts : [
            { x: -5, y: 0, z: 0 },
            { x: 5, y: 0, z: 0 },
          ]).map((p: any) => new THREE.Vector3(p.x, p.y ?? 0, p.z));

          const geom = new THREE.BufferGeometry().setFromPoints(vecPts);
          const lineMat = new THREE.LineBasicMaterial({
            color: new THREE.Color(baseColor),
            linewidth: isSelected ? 3 : 2,
          });
          const line = entity.parameters.closed ? new THREE.LineLoop(geom, lineMat) : new THREE.Line(geom, lineMat);
          group.add(line);

          // Vertex points
          vecPts.forEach((pt: any) => {
            const pGeom = new THREE.SphereGeometry(0.35, 12, 12);
            const pMat = new THREE.MeshBasicMaterial({ color: isSelected ? 0xf59e0b : 0x38bdf8 });
            const pMesh = new THREE.Mesh(pGeom, pMat);
            pMesh.position.copy(pt);
            group.add(pMesh);
          });
        }

        group.position.set(
          entity.parameters.posX ?? 0,
          entity.parameters.posY ?? 0,
          entity.parameters.posZ ?? 0
        );
        group.rotation.set(
          entity.parameters.rotX ?? 0,
          entity.parameters.rotY ?? 0,
          entity.parameters.rotZ ?? 0
        );
        obj = group;
      } else {
        // Solid geometry with bevel & CSG booleans
        const geom = buildEntityGeometry(entity, entitiesMap);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(baseColor),
          wireframe: wireframeMode,
          roughness: 0.25,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(
          entity.parameters.posX ?? 0,
          entity.parameters.posY ?? 0,
          entity.parameters.posZ ?? 0
        );
        mesh.rotation.set(
          entity.parameters.rotX ?? 0,
          entity.parameters.rotY ?? 0,
          entity.parameters.rotZ ?? 0
        );

        // CAD Edge Outlines for crisp CAD definition
        const edges = new THREE.EdgesGeometry(geom, 25);
        const lineMat = new THREE.LineBasicMaterial({
          color: isSelected ? 0xffffff : 0x0f172a,
          linewidth: isSelected ? 2 : 1,
        });
        const edgeLines = new THREE.LineSegments(edges, lineMat);
        mesh.add(edgeLines);

        obj = mesh;
      }

      obj.userData = { isCADEntity: true, entityId: entity.id };
      scene.add(obj);
      meshesMapRef.current.set(entity.id, obj);
    });

    // Sub-element Visual Highlight Overlay (Vertex, Edge, Face)
    if (selectedSubElement) {
      if (selectedSubElement.subType === 'vertex' && selectedSubElement.data?.point) {
        const markerGeom = new THREE.SphereGeometry(0.7, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, depthTest: false });
        const marker = new THREE.Mesh(markerGeom, markerMat);
        marker.renderOrder = 999;
        marker.position.set(
          selectedSubElement.data.point.x,
          selectedSubElement.data.point.y,
          selectedSubElement.data.point.z
        );
        marker.userData = { isCADEntity: true };
        scene.add(marker);
      } else if (selectedSubElement.subType === 'edge' && selectedSubElement.data?.edgePoints) {
        const [p1, p2] = selectedSubElement.data.edgePoints;
        const edgeGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(p1.x, p1.y, p1.z),
          new THREE.Vector3(p2.x, p2.y, p2.z),
        ]);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, linewidth: 5, depthTest: false });
        const edgeLine = new THREE.Line(edgeGeom, edgeMat);
        edgeLine.renderOrder = 999;
        edgeLine.userData = { isCADEntity: true };
        scene.add(edgeLine);
      } else if (selectedSubElement.subType === 'face') {
        const targetMesh = meshesMapRef.current.get(selectedSubElement.entityId);
        if (targetMesh && targetMesh instanceof THREE.Mesh && targetMesh.geometry) {
          const geom = targetMesh.geometry;
          const posAttr = geom.attributes.position;
          const faceIdx = selectedSubElement.index;
          if (geom.index) {
            const i1 = geom.index.getX(faceIdx * 3);
            const i2 = geom.index.getX(faceIdx * 3 + 1);
            const i3 = geom.index.getX(faceIdx * 3 + 2);
            if (i1 < posAttr.count && i2 < posAttr.count && i3 < posAttr.count) {
              const pA = new THREE.Vector3().fromBufferAttribute(posAttr, i1).applyMatrix4(targetMesh.matrixWorld);
              const pB = new THREE.Vector3().fromBufferAttribute(posAttr, i2).applyMatrix4(targetMesh.matrixWorld);
              const pC = new THREE.Vector3().fromBufferAttribute(posAttr, i3).applyMatrix4(targetMesh.matrixWorld);

              const faceGeom = new THREE.BufferGeometry().setFromPoints([pA, pB, pC]);
              faceGeom.setIndex([0, 1, 2]);
              faceGeom.computeVertexNormals();

              const faceMat = new THREE.MeshBasicMaterial({
                color: 0x34d399,
                transparent: true,
                opacity: 0.65,
                side: THREE.DoubleSide,
                depthTest: false,
              });
              const faceOverlay = new THREE.Mesh(faceGeom, faceMat);
              faceOverlay.renderOrder = 998;
              faceOverlay.userData = { isCADEntity: true };
              scene.add(faceOverlay);
            }
          }
        }
      }
    }

    // Attach gizmo to primary selected object in 3D viewport
    if (tControls) {
      if (selectedEntityIds.length > 0 && mode === '3D') {
        const primaryMesh = meshesMapRef.current.get(selectedEntityIds[selectedEntityIds.length - 1]);
        if (primaryMesh) {
          tControls.attach(primaryMesh);
        } else {
          tControls.detach();
        }
      } else {
        tControls.detach();
      }
    }
  }, [entities, selectedEntityIds, selectedSubElement, wireframeMode, mode]);

  const isDrawing = ['line', 'polyline', 'circle', 'rectangle'].includes(activeTool);

  return (
    <div
      className={`relative w-full h-full border border-gray-800/80 overflow-hidden bg-gray-950 group select-none ${
        isDrawing ? 'cursor-crosshair' : 'cursor-default'
      }`}
      onClick={handleViewportClick}
      onMouseMove={handleMouseMove}
    >
      {/* Viewport Header Overlay */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-gray-900/90 backdrop-blur px-2.5 py-1 rounded border border-gray-700/60 text-xs text-gray-300 shadow-md">
        <span className="font-semibold text-blue-400">{mode.toUpperCase()}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setWireframeMode(!wireframeMode);
          }}
          className="hover:text-white px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          {wireframeMode ? 'Shaded' : 'Wireframe'}
        </button>
        {mode === '3D' && selectedEntityIds.length > 0 && (
          <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGizmoMode('translate');
              }}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                gizmoMode === 'translate' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Move
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGizmoMode('rotate');
              }}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                gizmoMode === 'rotate' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Rotate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGizmoMode('scale');
              }}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                gizmoMode === 'scale' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Scale
            </button>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMaximize();
          }}
          className="hover:text-white px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 font-mono transition-colors ml-auto"
        >
          {isMaximized ? '❐ Restore' : '□ Maximize'}
        </button>
      </div>

      {/* Drawing active hint badge */}
      {isDrawing && (
        <div className="absolute top-2 right-2 z-10 bg-blue-950/80 border border-blue-500/50 text-blue-300 text-xs px-3 py-1 rounded shadow-lg backdrop-blur flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>
            Draw {activeTool.toUpperCase()}: Click on grid to {drawPoints.length === 0 ? 'start' : 'complete'}
          </span>
          {drawPoints.length > 0 && activeTool === 'polyline' && (
            <span className="text-gray-400">(double-click to finish)</span>
          )}
        </div>
      )}

      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};
