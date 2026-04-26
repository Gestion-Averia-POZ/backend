import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configurar cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL es requerida en .env');
  console.log('\n📝 Ejemplo:');
  console.log('SUPABASE_URL=https://tu-proyecto.supabase.co');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY es requerida en .env');
  console.log('\n📝 Cómo obtenerla:');
  console.log('1. Ve a tu proyecto en Supabase');
  console.log('2. Settings → API');
  console.log('3. Copia el "service_role" key (NO el "anon" key)');
  console.log('4. Agrégala a tu .env:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GeoJSONFeature {
  type: string;
  properties: {
    name?: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

async function importGeoJSON(filePath: string) {
  try {
    console.log('📂 Leyendo archivo GeoJSON...');
    
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }

    // Leer y parsear el archivo GeoJSON
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const geojson: GeoJSONData = JSON.parse(fileContent);

    if (!geojson.features || !Array.isArray(geojson.features)) {
      throw new Error('El archivo GeoJSON no tiene un formato válido');
    }

    console.log(`📊 Total de features encontradas: ${geojson.features.length}`);
    console.log('🚀 Iniciando importación...\n');

    let successCount = 0;
    let errorCount = 0;

    // Procesar cada feature
    for (let i = 0; i < geojson.features.length; i++) {
      const feature = geojson.features[i];
      const nombre = feature.properties.name || `Sector ${i + 1}`;
      const geometria = feature.geometry;

      try {
        // Insertar en Supabase usando RPC
        const { data, error } = await supabase.rpc('insert_neighborhood', {
          n_name: nombre,
          n_geom: geometria
        });

        if (error) {
          throw error;
        }

        successCount++;
        console.log(`✅ [${i + 1}/${geojson.features.length}] Sector "${nombre}" insertado correctamente`);
      } catch (error: any) {
        errorCount++;
        console.error(`❌ [${i + 1}/${geojson.features.length}] Error al insertar "${nombre}":`, error.message);
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('📈 RESUMEN DE IMPORTACIÓN');
    console.log('='.repeat(50));
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total: ${geojson.features.length}`);
    console.log('='.repeat(50));

  } catch (error: any) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// Obtener ruta del archivo desde argumentos de línea de comandos
const args = process.argv.slice(2);
const filePath = args[0];

if (!filePath) {
  console.error('❌ Error: Debes proporcionar la ruta del archivo GeoJSON');
  console.log('\nUso:');
  console.log('  npm run import:geojson <ruta-al-archivo.geojson>');
  console.log('\nEjemplo:');
  console.log('  npm run import:geojson ./data/neighborhoods.geojson');
  process.exit(1);
}

// Ejecutar importación
importGeoJSON(filePath);
