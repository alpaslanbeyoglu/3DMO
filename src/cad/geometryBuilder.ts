import * as THREE from 'three';
import { Evaluator, Brush, ADDITION, SUBTRACTION, INTERSECTION } from 'three-bvh-csg';
import { CADEntity } from '../types/cad';

const evaluator = new Evaluator();
evaluator.useGroups = false;

/**
 * Builds a rounded rectangle shape for beveled box or planar curves
 */
export function createRoundedRectShape(
  width: number,
  height: number,
  radius: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
}

/**
 * Creates a THREE.BufferGeometry for an individual CAD entity
 */
export function buildEntityGeometry(entity: CADEntity, entitiesMap?: Map<string, CADEntity>): THREE.BufferGeometry {
  const { parameters, subType } = entity;

  // Solid: Box (with Bevel / Fillet / Chamfer support)
  if (subType === 'box') {
    const w = parameters.width ?? 10;
    const h = parameters.height ?? 10;
    const d = parameters.depth ?? 10;
    const bevelSize = parameters.bevelSize ?? parameters.chamferDistance ?? 0;
    const filletRadius = parameters.filletRadius ?? 0;

    if (bevelSize > 0 || filletRadius > 0) {
      const radius = filletRadius > 0 ? filletRadius : bevelSize;
      const shape = createRoundedRectShape(w, d, radius);
      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: Math.max(0.1, h - (filletRadius > 0 ? filletRadius * 2 : 0)),
        bevelEnabled: bevelSize > 0 || filletRadius > 0,
        bevelThickness: radius,
        bevelSize: radius,
        bevelSegments: filletRadius > 0 ? 5 : 1,
      };
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.center();
      // rotate so extrusion runs along Y axis
      geom.rotateX(Math.PI / 2);
      return geom;
    }

    return new THREE.BoxGeometry(w, h, d);
  }

  // Solid: Cylinder
  if (subType === 'cylinder') {
    const r = parameters.radius ?? 5;
    const h = parameters.height ?? 10;
    const geom = new THREE.CylinderGeometry(r, r, h, 32);
    return geom;
  }

  // Solid: Sphere
  if (subType === 'sphere') {
    const r = parameters.radius ?? 5;
    return new THREE.SphereGeometry(r, 32, 32);
  }

  // Solid: Cone
  if (subType === 'cone') {
    const r = parameters.radius ?? 5;
    const h = parameters.height ?? 10;
    return new THREE.ConeGeometry(r, h, 32);
  }

  // Solid: Torus
  if (subType === 'torus') {
    const r = parameters.radius ?? 6;
    const tube = parameters.tube ?? 2;
    return new THREE.TorusGeometry(r, tube, 20, 48);
  }

  // Solid: Extruded
  if (subType === 'extruded') {
    const dist = parameters.extrudeDistance ?? 10;
    const bevelSize = parameters.bevelSize ?? 0;
    const bevelSegments = parameters.bevelSegments ?? 2;
    const points: Array<{ x: number; y: number; z: number }> = parameters.points || [];

    let shape: THREE.Shape;
    if (points.length >= 3) {
      shape = new THREE.Shape();
      shape.moveTo(points[0].x, points[0].z ?? points[0].y);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].z ?? points[i].y);
      }
      shape.closePath();
    } else {
      const w = parameters.width ?? 10;
      const d = parameters.depth ?? 10;
      shape = createRoundedRectShape(w, d, bevelSize > 0 ? bevelSize : 0);
    }

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: dist,
      bevelEnabled: bevelSize > 0,
      bevelThickness: bevelSize,
      bevelSize: bevelSize,
      bevelSegments: bevelSegments,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    geom.rotateX(Math.PI / 2);
    return geom;
  }

  // Solid: Revolved
  if (subType === 'revolved') {
    const angle = (parameters.revolveAngle ?? 360) * (Math.PI / 180);
    const r = parameters.radius ?? 6;
    const h = parameters.height ?? 10;

    // Lathe profile points
    const points = [
      new THREE.Vector2(0, -h / 2),
      new THREE.Vector2(r, -h / 2),
      new THREE.Vector2(r * 0.8, 0),
      new THREE.Vector2(r, h / 2),
      new THREE.Vector2(0, h / 2),
    ];
    return new THREE.LatheGeometry(points, 32, 0, angle);
  }

  // Solid: Boolean
  if (subType === 'boolean' && entitiesMap) {
    const opA = entitiesMap.get(parameters.operandAId);
    const opB = entitiesMap.get(parameters.operandBId);

    if (opA && opB) {
      try {
        const geomA = buildEntityGeometry(opA, entitiesMap);
        const geomB = buildEntityGeometry(opB, entitiesMap);
        const dummyMat = new THREE.MeshBasicMaterial();

        const brushA = new Brush(geomA, dummyMat);
        brushA.position.set(opA.parameters.posX ?? 0, opA.parameters.posY ?? 0, opA.parameters.posZ ?? 0);
        brushA.rotation.set(opA.parameters.rotX ?? 0, opA.parameters.rotY ?? 0, opA.parameters.rotZ ?? 0);
        brushA.updateMatrixWorld();

        const brushB = new Brush(geomB, dummyMat);
        brushB.position.set(opB.parameters.posX ?? 0, opB.parameters.posY ?? 0, opB.parameters.posZ ?? 0);
        brushB.rotation.set(opB.parameters.rotX ?? 0, opB.parameters.rotY ?? 0, opB.parameters.rotZ ?? 0);
        brushB.updateMatrixWorld();

        let op = ADDITION;
        if (parameters.booleanType === 'difference') op = SUBTRACTION;
        else if (parameters.booleanType === 'intersection') op = INTERSECTION;

        const resultBrush = evaluator.evaluate(brushA, brushB, op);
        if (resultBrush && resultBrush.geometry) {
          // Normalize position relative to entity center
          return resultBrush.geometry.clone();
        }
      } catch (err) {
        console.warn('CSG Boolean evaluation fallback:', err);
      }
    }
  }

  // Fallback solid geometry
  return new THREE.BoxGeometry(
    parameters.width ?? 10,
    parameters.height ?? 10,
    parameters.depth ?? 10
  );
}
