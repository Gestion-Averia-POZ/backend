// Funciones auxiliares para trabajar con geometrías PostGIS

export const createPoint = (lat: number, lng: number) => {
  return `SRID=4326;POINT(${lng} ${lat})`;
};

export const parseGeometry = (geom: any) => {
  // Parsear geometría desde PostGIS
  return geom;
};
