# 📍 Script de Importación de GeoJSON

Este script permite importar datos geográficos desde archivos GeoJSON a la base de datos de Supabase.

## 🚀 Uso

### Paso 1: Crear la función en Supabase

Antes de importar, debes crear la función SQL en Supabase:

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Ejecuta el contenido del archivo `create-insert-function.sql`

```sql
CREATE OR REPLACE FUNCTION insert_neighborhood(
  n_name TEXT,
  n_geom JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "Neighborhood" (name, geom)
  VALUES (
    n_name,
    ST_GeomFromGeoJSON(n_geom::text)
  );
END;
$$;
```

### Paso 2: Configurar variables de entorno

Asegúrate de tener estas variables en tu `.env`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ACCESS_TOKEN=tu_service_role_key
```

### Paso 3: Ejecutar el script

```bash
npm run import:geojson <ruta-al-archivo.geojson>
```

**Ejemplo:**
```bash
npm run import:geojson ./data/neighborhoods.geojson
```

## 📋 Formato del GeoJSON

El archivo GeoJSON debe tener esta estructura:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Nombre del Sector"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-66.123, 10.456],
            [-66.124, 10.457],
            [-66.125, 10.458],
            [-66.123, 10.456]
          ]
        ]
      }
    }
  ]
}
```

## 📊 Salida del Script

El script mostrará:
- Progreso de cada feature importada
- Errores específicos si alguna falla
- Resumen final con estadísticas

**Ejemplo de salida:**
```
📂 Leyendo archivo GeoJSON...
📊 Total de features encontradas: 50
🚀 Iniciando importación...

✅ [1/50] Sector "Centro" insertado correctamente
✅ [2/50] Sector "Norte" insertado correctamente
❌ [3/50] Error al insertar "Sur": duplicate key value

==================================================
📈 RESUMEN DE IMPORTACIÓN
==================================================
✅ Exitosos: 48
❌ Errores: 2
📊 Total: 50
==================================================
```

## 🔧 Solución de Problemas

### Error: "function insert_neighborhood does not exist"
- Asegúrate de haber ejecutado el SQL en Supabase primero

### Error: "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos"
- Verifica que las variables estén en tu archivo `.env`

### Error: "Archivo no encontrado"
- Verifica la ruta del archivo GeoJSON
- Usa rutas relativas desde la raíz del proyecto

### Error: "duplicate key value"
- Ya existe un registro con ese nombre
- Puedes modificar la función SQL para usar `ON CONFLICT` si quieres actualizar

## 📝 Notas

- El script procesa las features una por una
- Si una feature falla, continúa con las siguientes
- Los nombres se toman de `properties.name` o se genera uno automático
- La geometría debe ser válida según el estándar GeoJSON
