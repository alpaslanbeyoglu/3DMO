import { CADEntity } from '../types/cad';

export function performExtrude(
  sourceEntity: CADEntity,
  distance: number = 10
): Omit<CADEntity, 'id'> {
  return {
    name: `Extruded ${sourceEntity.name}`,
    type: 'solid',
    subType: 'box',
    visible: true,
    color: '#10b981',
    layerId: sourceEntity.layerId,
    parameters: {
      width: sourceEntity.parameters.width || 10,
      height: distance,
      depth: sourceEntity.parameters.depth || 10,
      posX: sourceEntity.parameters.posX || 0,
      posY: (sourceEntity.parameters.posY || 0) + distance / 2,
      posZ: sourceEntity.parameters.posZ || 0,
      parentEntityId: sourceEntity.id,
      extrudeDistance: distance,
    },
  };
}

export function performRevolve(
  sourceEntity: CADEntity,
  angleDegrees: number = 360
): Omit<CADEntity, 'id'> {
  return {
    name: `Revolved ${sourceEntity.name}`,
    type: 'solid',
    subType: 'cylinder',
    visible: true,
    color: '#8b5cf6',
    layerId: sourceEntity.layerId,
    parameters: {
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
  let subType = entityA.subType;
  let color = entityA.color;

  if (opType === 'union') {
    color = '#2563eb';
  } else if (opType === 'difference') {
    color = '#dc2626';
  } else {
    color = '#059669';
  }

  return {
    name: `Boolean_${opType.toUpperCase()} (${entityA.name}, ${entityB.name})`,
    type: 'solid',
    subType: subType,
    visible: true,
    color: color,
    layerId: entityA.layerId,
    parameters: {
      ...entityA.parameters,
      booleanType: opType,
      operandAId: entityA.id,
      operandBId: entityB.id,
    },
  };
}

export function performFillet(
  entity: CADEntity,
  radius: number = 2
): CADEntity {
  return {
    ...entity,
    name: `${entity.name} (Filleted R${radius})`,
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
    name: `${entity.name} (Chamfered ${distance})`,
    parameters: {
      ...entity.parameters,
      chamferDistance: distance,
    },
  };
}
