import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { useCADStore } from '../store/cadStore';

interface TransformGizmoProps {
  scene: THREE.Scene;
  camera: THREE.Camera;
  glDomElement: HTMLCanvasElement;
  targetObject: THREE.Object3D | null;
  mode?: 'translate' | 'rotate' | 'scale';
}

export const TransformGizmo: React.FC<TransformGizmoProps> = ({
  scene,
  camera,
  glDomElement,
  targetObject,
  mode = 'translate',
}) => {
  const updateEntityParameters = useCADStore((state) => state.updateEntityParameters);
  const controlsRef = useRef<TransformControls | null>(null);

  useEffect(() => {
    if (!scene || !camera || !glDomElement) return;

    const controls = new TransformControls(camera, glDomElement);
    controls.setMode(mode);
    controlsRef.current = controls;

    if (targetObject) {
      controls.attach(targetObject);
      scene.add(controls.getHelper());
    }

    const handleChange = () => {
      if (targetObject && targetObject.userData.entityId) {
        const entityId = targetObject.userData.entityId;
        updateEntityParameters(entityId, {
          posX: targetObject.position.x,
          posY: targetObject.position.y,
          posZ: targetObject.position.z,
          rotX: targetObject.rotation.x,
          rotY: targetObject.rotation.y,
          rotZ: targetObject.rotation.z,
          scaleX: targetObject.scale.x,
          scaleY: targetObject.scale.y,
          scaleZ: targetObject.scale.z,
        });
      }
    };

    controls.addEventListener('change', handleChange);

    return () => {
      controls.removeEventListener('change', handleChange);
      controls.detach();
      scene.remove(controls.getHelper());
      controls.dispose();
    };
  }, [scene, camera, glDomElement, targetObject, mode]);

  return null;
};
