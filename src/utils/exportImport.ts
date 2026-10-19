import { CADEntity } from '../types/cad';

export function exportProjectJSON(entities: CADEntity[], layers: any[]): void {
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

export function exportToSTL(entities: CADEntity[]): void {
  let stlContent = 'solid 3DMO_Export\n';

  entities.forEach((ent) => {
    if (!ent.visible) return;
    const { width = 10, height = 10, depth = 10, posX = 0, posY = 0, posZ = 0 } = ent.parameters;
    const x = posX, y = posY, z = posZ;
    const w = width / 2, h = height / 2, d = depth / 2;

    stlContent += `
  facet normal 0 0 1
    outer loop
      vertex ${x - w} ${y - h} ${z + d}
      vertex ${x + w} ${y - h} ${z + d}
      vertex ${x + w} ${y + h} ${z + d}
    endloop
  endfacet
`;
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
