import { CADEntity, Layer } from '../types/cad';

export function exportProjectJSON(entities: CADEntity[], layers: Layer[]): void {
  const data = {
    version: '1.0',
    app: '3DMO Parametric CAD',
    createdAt: new Date().toISOString(),
    layers,
    entities,
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `project_${Date.now()}.moi3d`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importProjectJSON(
  file: File,
  onSuccess: (entities: CADEntity[], layers: Layer[]) => void,
  onError?: (err: string) => void
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.entities)) {
        onSuccess(parsed.entities, parsed.layers || []);
      } else {
        onError?.('Invalid CAD project file format');
      }
    } catch (err: any) {
      onError?.(err.message || 'Failed to parse CAD file');
    }
  };
  reader.readAsText(file);
}

export function exportToSTL(entities: CADEntity[]): void {
  let stlContent = 'solid 3DMO_Export\n';

  entities.forEach((ent) => {
    if (!ent.visible) return;
    const { width = 10, height = 10, depth = 10, posX = 0, posY = 0, posZ = 0 } = ent.parameters;
    const x = posX, y = posY, z = posZ;
    const w = width / 2, h = height / 2, d = depth / 2;

    // Output box faces
    const faces = [
      // Top (+Y)
      [[x - w, y + h, z - d], [x + w, y + h, z - d], [x + w, y + h, z + d]],
      [[x - w, y + h, z - d], [x + w, y + h, z + d], [x - w, y + h, z + d]],
      // Bottom (-Y)
      [[x - w, y - h, z - d], [x + w, y - h, z + d], [x + w, y - h, z - d]],
      [[x - w, y - h, z - d], [x - w, y - h, z + d], [x + w, y - h, z + d]],
      // Front (+Z)
      [[x - w, y - h, z + d], [x + w, y - h, z + d], [x + w, y + h, z + d]],
      [[x - w, y - h, z + d], [x + w, y + h, z + d], [x - w, y + h, z + d]],
      // Back (-Z)
      [[x - w, y - h, z - d], [x + w, y + h, z - d], [x + w, y - h, z - d]],
      [[x - w, y - h, z - d], [x - w, y + h, z - d], [x + w, y + h, z - d]],
    ];

    faces.forEach((triangle) => {
      stlContent += `  facet normal 0 0 1\n    outer loop\n`;
      triangle.forEach(([vx, vy, vz]) => {
        stlContent += `      vertex ${vx.toFixed(4)} ${vy.toFixed(4)} ${vz.toFixed(4)}\n`;
      });
      stlContent += `    endloop\n  endfacet\n`;
    });
  });

  stlContent += 'endsolid 3DMO_Export\n';

  const blob = new Blob([stlContent], { type: 'model/stl' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `model_${Date.now()}.stl`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToSTEP(entities: CADEntity[]): void {
  const header = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('3DMO STEP CAD Export'),'2;1');
FILE_NAME('model.step','${new Date().toISOString()}',('Author'),('3DMO'),'3DMO Kernel','3DMO Kernel','');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1.1 }'));
ENDSEC;
DATA;\n`;

  let body = `#10 = ORGANIZATIONAL_PROJECT('3DMO Project','');\n`;
  entities.forEach((ent, idx) => {
    body += `#${100 + idx} = MANIFOLD_SOLID_BREP('${ent.name}',#${200 + idx});\n`;
  });
  const footer = `ENDSEC;\nEND-ISO-10303-21;\n`;

  const stepContent = header + body + footer;
  const blob = new Blob([stepContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `model_${Date.now()}.step`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
