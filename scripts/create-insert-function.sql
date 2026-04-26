-- Función para insertar neighborhoods desde GeoJSON
-- Ejecuta este SQL en el editor SQL de Supabase antes de importar

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

-- Dar permisos si es necesario
-- GRANT EXECUTE ON FUNCTION insert_neighborhood TO authenticated;
-- GRANT EXECUTE ON FUNCTION insert_neighborhood TO anon;
