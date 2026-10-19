import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { useCADStore } from '../store/cadStore';
import { snapPointToGrid } from '../utils/snapping';

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
  const selectEntity = useCADStore((state) => state.selectEntity);
  const selectSubElement = useCADStore((state) => state.selectSubElement);
  const updateEntityParameters = useCADStore((state) => state.updateEntityParameters);
  const snapping = useCADStore((state) => state.snapping);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const meshesMapRef = useRef<Map<string, THREE.Object3D>>(new Map());

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#18181b');
    sceneRef.current = scene;

    // Grid Helper & Axes Helper
    const gridHelper = new THREE.GridHelper(50, 50, '#3b82f6', '#374151');
    gridHelper.position.y = 0;
    if (mode === 'Top') {
      gridHelper.rotation.x = Math.PI / 2;
    } else if (mode === 'Front') {
      gridHelper.rotation.x = 0;
    }
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    // Camera setup based on view mode
    let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    const aspect = width / height;
    const frustumSize = 25;

    if (mode === '3D') {
      camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
      camera.position.set(20, 20, 20);
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
      camera.position.set(0, 50, 0);
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
      camera.position.set(0, 0, 50);
      camera.lookAt(0, 0, 0);
    } else {
      // Right
      camera = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
      );
      camera.position.set(50, 0, 0);
      camera.lookAt(0, 0, 0);
    }
    cameraRef.current = camera;

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = mode === '3D';
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // TransformControls (3D Gizmo)
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

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Click Raycasting for Selection & Interactive Inspection
    const handleClick = (e: MouseEvent) => {
      if (!mountRef.current || !cameraRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const cadMeshes: THREE.Object3D[] = [];
      scene.children.forEach((child) => {
        if (child.userData && child.userData.isCADEntity) {
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

          // On-click sub-element detection (face vs edge vs vertex)
          if (hit.faceIndex !== undefined && hit.faceIndex !== null) {
            selectSubElement({
              entityId: hitObj.userData.entityId,
              subType: 'face',
              index: hit.faceIndex,
            });
          }
        }
      } else {
        if (!tControls.dragging) {
          selectEntity(null);
          selectSubElement(null);
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('click', handleClick);

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
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
      domEl.removeEventListener('click', handleClick);
      tControls.dispose();
      if (rendererRef.current && rendererRef.current.domElement) {
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

  // Re-render entities in scene & update gizmo attachment
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const tControls = transformControlsRef.current;

    // Remove existing entity meshes
    const toRemove: THREE.Object3D[] = [];
    scene.children.forEach((child) => {
      if (child.userData && child.userData.isCADEntity) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((obj) => scene.remove(obj));
    meshesMapRef.current.clear();

    // Add current entities
    entities.forEach((entity) => {
      if (!entity.visible) return;

      const isSelected = selectedEntityIds.includes(entity.id);
      const color = isSelected ? '#f59e0b' : entity.color || '#3b82f6';

      let mesh: THREE.Object3D;

      if (entity.subType === 'box') {
        const { width = 10, height = 10, depth = 10, posX = 0, posY = 0, posZ = 0, rotX = 0, rotY = 0, rotZ = 0 } = entity.parameters;
        const geom = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          wireframe: wireframeMode,
          roughness: 0.3,
          metalness: 0.1,
        });
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(posX, posY, posZ);
        mesh.rotation.set(rotX, rotY, rotZ);
      } else if (entity.subType === 'cylinder') {
        const { radius = 5, height = 10, posX = 0, posY = 0, posZ = 0, rotX = 0, rotY = 0, rotZ = 0 } = entity.parameters;
        const geom = new THREE.CylinderGeometry(radius, radius, height, 32);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          wireframe: wireframeMode,
        });
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(posX, posY, posZ);
        mesh.rotation.set(rotX, rotY, rotZ);
      } else if (entity.subType === 'sphere') {
        const { radius = 5, posX = 0, posY = 0, posZ = 0, rotX = 0, rotY = 0, rotZ = 0 } = entity.parameters;
        const geom = new THREE.SphereGeometry(radius, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          wireframe: wireframeMode,
        });
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(posX, posY, posZ);
        mesh.rotation.set(rotX, rotY, rotZ);
      } else if (entity.subType === 'cone') {
        const { radius = 5, height = 10, posX = 0, posY = 0, posZ = 0, rotX = 0, rotY = 0, rotZ = 0 } = entity.parameters;
        const geom = new THREE.ConeGeometry(radius, height, 32);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          wireframe: wireframeMode,
        });
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(posX, posY, posZ);
        mesh.rotation.set(rotX, rotY, rotZ);
      } else {
        const geom = new THREE.BoxGeometry(5, 5, 5);
        const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color) });
        mesh = new THREE.Mesh(geom, mat);
      }

      mesh.userData = { isCADEntity: true, entityId: entity.id };

      if (mesh instanceof THREE.Mesh) {
        const edges = new THREE.EdgesGeometry(mesh.geometry);
        const lineMat = new THREE.LineBasicMaterial({
          color: isSelected ? 0xffffff : 0x000000,
          linewidth: isSelected ? 2 : 1,
        });
        const line = new THREE.LineSegments(edges, lineMat);
        mesh.add(line);
      }

      scene.add(mesh);
      meshesMapRef.current.set(entity.id, mesh);
    });

    // Attach gizmo to primary selected mesh in 3D viewport
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
  }, [entities, selectedEntityIds, wireframeMode, mode]);

  return (
    <div className="relative w-full h-full border border-gray-800 overflow-hidden bg-gray-950 group select-none">
      {/* Viewport Header Overlay */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-gray-900/85 backdrop-blur px-2.5 py-1 rounded border border-gray-700/60 text-xs text-gray-300 shadow-md">
        <span className="font-semibold text-blue-400">{mode.toUpperCase()}</span>
        <button
          onClick={() => setWireframeMode(!wireframeMode)}
          className="hover:text-white px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          {wireframeMode ? 'Shaded' : 'Wireframe'}
        </button>
        {mode === '3D' && selectedEntityIds.length > 0 && (
          <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
            <button
              onClick={() => setGizmoMode('translate')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                gizmoMode === 'translate' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Move
            </button>
            <button
              onClick={() => setGizmoMode('rotate')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                gizmoMode === 'rotate' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Rotate
            </button>
            <button
              onClick={() => setGizmoMode('scale')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                gizmoMode === 'scale' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Scale
            </button>
          </div>
        )}
        <button
          onClick={onToggleMaximize}
          className="hover:text-white px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 font-mono transition-colors ml-auto"
        >
          {isMaximized ? '❐ Restore' : '□ Maximize'}
        </button>
      </div>

      <div ref={mountRef} className="w-full h-full cursor-crosshair" />
    </div>
  );
};
