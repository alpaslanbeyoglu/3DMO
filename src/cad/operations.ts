import { CADEntity } from '../types/cad';

export interface ExtrudeOptions {
  distance?: number;
  bevelEnabled?: boolean;
  bevelSize?: number;
  bevelSegments?: number;
}

export function performExtrude(
  sourceEntity: CADEntity,
  options: ExtrudeOptions = {}
): Omit<CADEntity, 'id'> {
  const distance = options.distance ?? 10;
  const bevelEnabled = options.bevelEnabled ?? false;
  const bevelSize = options.bevelSize ?? 0.8;
  const bevelSegments = options.bevelSegments ?? 2;

  const pts = sourceEntity.parameters.points || [];

  return {
    name: `Extrude (${sourceEntity.name})`,
    type: 'solid',
    subType: 'extruded',
    visible: true,
    color: '#10b981',
    layerId: sourceEntity.layerId,
    parameters: {
      ...sourceEntity.parameters,
      width: sourceEntity.parameters.width || 10,
      depth: sourceEntity.parameters.depth || 10,
      extrudeDistance: distance,
      height: distance,
      bevelEnabled: bevelEnabled,
      bevelSize: bevelEnabled ? bevelSize : 0,
      bevelSegments: bevelSegments,
      posX: sourceEntity.parameters.posX || 0,
      posY: (sourceEntity.parameters.posY || 0) + distance / 2,
      posZ: sourceEntity.parameters.posZ || 0,
      points: pts,
      parentEntityId: sourceEntity.id,
    },
  };
}

export function performRevolve(
  sourceEntity: CADEntity,
  angleDegrees: number = 360
): Omit<CADEntity, 'id'> {
  return {
    name: `Revolve (${sourceEntity.name})`,
    type: 'solid',
    subType: 'revolved',
    visible: true,
    color: '#8b5cf6',
    layerId: sourceEntity.layerId,
    parameters: {
      ...sourceEntity.parameters,
      radius: sourceEntity.parameters.radius || 6,
      height: sourceEntity.parameters.height || 12,
      posX: sourceEntity.parameters.posX || 0,
      posY: sourceEntity.parameters.posY || 0,
      posZ: sourceEntity.parameters.posZ || 0,
      revolveAngle: angleDegrees,
      parentEntityId: sourceEntity.id,
    },
  };
}

export function performBooleanOperation(
  entityA: CADEntity,
  entityB: CADEntity,
  opType: 'union' | 'difference' | 'intersection'
): Omit<CADEntity, 'id'> {
  let color = '#2563eb';
  let opLabel = 'Union';

  if (opType === 'difference') {
    color = '#ef4444';
    opLabel = 'Difference';
  } else if (opType === 'intersection') {
    color = '#10b981';
    opLabel = 'Intersection';
  }

  return {
    name: `${opLabel} (${entityA.name} & ${entityB.name})`,
    type: 'solid',
    subType: 'boolean',
    visible: true,
    color,
    layerId: entityA.layerId,
    parameters: {
      ...entityA.parameters,
      booleanType: opType,
      operandAId: entityA.id,
      operandBId: entityB.id,
      posX: entityA.parameters.posX || 0,
      posY: entityA.parameters.posY || 0,
      posZ: entityA.parameters.posZ || 0,
    },
  };
}

export function performFillet(
  entity: CADEntity,
  radius: number = 2
): CADEntity {
  return {
    ...entity,
    name: `${entity.name} (Fillet R${radius})`,
    parameters: {
      ...entity.parameters,
      filletRadius: radius,
    },
  };
}

export function performChamfer(
  entity: CADEntity,
  distance: number = 2
): CADEntity {
  return {
    ...entity,
    name: `${entity.name} (Chamfer ${distance})`,
    parameters: {
      ...entity.parameters,
      chamferDistance: distance,
      bevelSize: distance,
      bevelSegments: 1,
    },
  };
}

export function performBevel(
  entity: CADEntity,
  size: number = 1.5,
  segments: number = 3
): CADEntity {
  return {
    ...entity,
    name: `${entity.name} (Bevel ${size}mm)`,
    parameters: {
      ...entity.parameters,
      bevelEnabled: true,
      bevelSize: size,
      bevelSegments: segments,
    },
  };
}
