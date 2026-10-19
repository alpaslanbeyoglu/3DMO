import * as THREE from 'three';
import { SnappingSettings, Vector3D } from '../types/cad';

export function snapPointToGrid(point: Vector3D, gridSize: number): Vector3D {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
    z: Math.round(point.z / gridSize) * gridSize,
  };
}

export function findObjectSnapPoint(
  mouseRay: THREE.Ray,
  objects: THREE.Object3D[],
  settings: SnappingSettings,
  threshold: number = 0.8
): { point: THREE.Vector3; type: string } | null {
  if (!settings.objectSnap) return null;

  const candidatePoints: { point: THREE.Vector3; type: string }[] = [];

  objects.forEach((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry) {
      const posAttr = obj.geometry.attributes.position;
      if (!posAttr) return;

      const matrixWorld = obj.matrixWorld;

      for (let i = 0; i < posAttr.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
        v.applyMatrix4(matrixWorld);

        if (settings.snapEndpoints) {
          candidatePoints.push({ point: v, type: 'Endpoint' });
        }
      }
    }
  });

  let closest: { point: THREE.Vector3; type: string } | null = null;
  let minDistance = threshold;

  candidatePoints.forEach((cand) => {
    const dist = mouseRay.distanceToPoint(cand.point);
    if (dist < minDistance) {
      minDistance = dist;
      closest = cand;
    }
  });

  return closest;
}
