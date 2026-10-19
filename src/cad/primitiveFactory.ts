import { CADEntity } from '../types/cad';

export interface BoxParameters {
  width: number;
  height: number;
  depth: number;
  posX: number;
  posY: number;
  posZ: number;
}

export interface CylinderParameters {
  radius: number;
  height: number;
  posX: number;
  posY: number;
  posZ: number;
}

export interface SphereParameters {
  radius: number;
  posX: number;
  posY: number;
  posZ: number;
}

export interface ConeParameters {
  radius: number;
  height: number;
  posX: number;
  posY: number;
  posZ: number;
}

export interface CurveParameters {
  points: Array<{ x: number; y: number; z: number }>;
  closed?: boolean;
}

export function createBoxEntity(params: Partial<BoxParameters>): Omit<CADEntity, 'id'> {
  return {
    name: 'Box Primitive',
    type: 'solid',
    subType: 'box',
    visible: true,
    color: '#3b82f6',
    layerId: 'default',
    parameters: {
      width: params.width ?? 10,
      height: params.height ?? 10,
      depth: params.depth ?? 10,
      posX: params.posX ?? 0,
      posY: params.posY ?? 0,
      posZ: params.posZ ?? 0,
    },
  };
}

export function createCylinderEntity(params: Partial<CylinderParameters>): Omit<CADEntity, 'id'> {
  return {
    name: 'Cylinder Primitive',
    type: 'solid',
    subType: 'cylinder',
    visible: true,
    color: '#10b981',
    layerId: 'default',
    parameters: {
      radius: params.radius ?? 5,
      height: params.height ?? 10,
      posX: params.posX ?? 0,
      posY: params.posY ?? 0,
      posZ: params.posZ ?? 0,
    },
  };
}

export function createSphereEntity(params: Partial<SphereParameters>): Omit<CADEntity, 'id'> {
  return {
    name: 'Sphere Primitive',
    type: 'solid',
    subType: 'sphere',
    visible: true,
    color: '#f59e0b',
    layerId: 'default',
    parameters: {
      radius: params.radius ?? 5,
      posX: params.posX ?? 0,
      posY: params.posY ?? 0,
      posZ: params.posZ ?? 0,
    },
  };
}

export function createConeEntity(params: Partial<ConeParameters>): Omit<CADEntity, 'id'> {
  return {
    name: 'Cone Primitive',
    type: 'solid',
    subType: 'cone',
    visible: true,
    color: '#ec4899',
    layerId: 'default',
    parameters: {
      radius: params.radius ?? 5,
      height: params.height ?? 10,
      posX: params.posX ?? 0,
      posY: params.posY ?? 0,
      posZ: params.posZ ?? 0,
    },
  };
}

export function create2DCurveEntity(
  subType: 'line' | 'polyline' | 'rectangle' | 'circle',
  params: CurveParameters
): Omit<CADEntity, 'id'> {
  return {
    name: `${subType.toUpperCase()} Curve`,
    type: 'curve',
    subType,
    visible: true,
    color: '#06b6d4',
    layerId: 'default',
    parameters: {
      points: params.points,
      closed: params.closed ?? false,
    },
  };
}
