-- Función simple para detectar el barrio/sector basado en coordenadas GPS
-- Esta función usa ST_Contains para verificar si un punto está dentro de un polígono
-- Ejecuta este SQL en el editor SQL de Supabase ANTES de crear reportes

CREATE OR REPLACE FUNCTION get_neighborhood_by_point(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  neighborhood_id INT;
BEGIN
  -- Buscar el barrio que contiene el punto
  SELECT n.id INTO neighborhood_id
  FROM "Neighborhood" n
  WHERE ST_Contains(
    n.geom,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  )
  LIMIT 1;
  
  RETURN neighborhood_id;
END;
$$;

-- Dar permisos para que la aplicación pueda usar la función
GRANT EXECUTE ON FUNCTION get_neighborhood_by_point TO authenticated;
GRANT EXECUTE ON FUNCTION get_neighborhood_by_point TO anon;
