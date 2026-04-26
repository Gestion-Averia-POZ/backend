import { createClient } from '@supabase/supabase-js';

interface Coordinates {
  latitude: number;
  longitude: number;
}

class GeolocationService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Obtiene el ID del barrio que contiene las coordenadas
   * Retorna null si no está dentro de ningún barrio
   */
  async getNeighborhoodIdByPoint(coordinates: Coordinates): Promise<number | null> {
    try {
      const { latitude, longitude } = coordinates;

      // Validar coordenadas
      if (!this.isValidCoordinate(latitude, longitude)) {
        throw new Error('Coordenadas inválidas');
      }

      // Llamar a la función RPC de Supabase
      const { data, error } = await this.supabase.rpc('get_neighborhood_by_point', {
        lat: latitude,
        lng: longitude
      });

      if (error) {
        console.error('Error obteniendo barrio:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en getNeighborhoodIdByPoint:', error);
      return null;
    }
  }

  /**
   * Valida que las coordenadas estén en rangos válidos
   */
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }
}

export default new GeolocationService();
