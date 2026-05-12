import fs from 'fs/promises';
import path from 'path';
import prisma from '../config/prisma';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  category: string;
}

export interface HeatmapData {
  updatedAt: string;
  totals: {
    total: number;
    byServiceType: { luz: number; agua: number; aseo: number };
    byCategory: Record<string, number>;
  };
  points: HeatmapPoint[];
}

function categoryToServiceType(name: string): 'luz' | 'agua' | 'aseo' | null {
  const n = name.toLowerCase();
  if (n.includes('electric') || n === 'luz') return 'luz';
  if (n.includes('agua')) return 'agua';
  if (n.includes('aseo') || n.includes('urban') || n.includes('basura')) return 'aseo';
  return null;
}

async function generate(): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{
    latitude: number;
    longitude: number;
    category_name: string;
  }>>`
    SELECT
      ST_Y(r.location) AS latitude,
      ST_X(r.location) AS longitude,
      c.name           AS category_name
    FROM report r
    JOIN category c ON r.category_id = c.id
    JOIN state   s ON r.state_id    = s.id
    WHERE r.is_active = true
      AND s.name IN ('PENDIENTE', 'EN_PROCESO')
      AND r.location IS NOT NULL
  `;

  const points: HeatmapPoint[] = rows.map((r) => ({
    lat: Number(r.latitude),
    lng: Number(r.longitude),
    category: r.category_name,
  }));

  const byCategory: Record<string, number> = {};
  const byServiceType = { luz: 0, agua: 0, aseo: 0 };

  for (const p of points) {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
    const st = categoryToServiceType(p.category);
    if (st) byServiceType[st]++;
  }

  const data: HeatmapData = {
    updatedAt: new Date().toISOString(),
    totals: { total: points.length, byServiceType, byCategory },
    points,
  };

  const publicDir = path.join(process.cwd(), 'public');
  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(
    path.join(publicDir, 'heatmap-data.json'),
    JSON.stringify(data),
  );

  console.log(`✅ Heatmap actualizado — ${points.length} reportes activos`);
}

export const heatmapService = { generate };
