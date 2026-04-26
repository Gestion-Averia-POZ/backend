interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AddressComponents {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  region?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  // Campos específicos de Venezuela
  city_district?: string;
  borough?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: AddressComponents;
  error?: string;
  lat?: string;
  lon?: string;
}

interface ReverseGeocodeResult {
  formattedAddress: string;
  street?: string;
  neighborhood?: string;
  parish?: string; // Parroquia
  municipality?: string; // Municipio
  county?: string; // Condado/Municipio alternativo
  stateDistrict?: string; // Distrito estatal
  borough?: string; // Distrito/Barrio administrativo
  cityDistrict?: string; // Distrito de ciudad
  quarter?: string; // Sector/Cuadrante
  village?: string; // Aldea/Pueblo pequeño
  town?: string; // Pueblo/Ciudad pequeña
  city?: string;
  region?: string; // Región
  state?: string;
  country?: string;
  postalCode?: string;
  countryCode?: string;
  raw?: any;
}

class GeocodingService {
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
  private readonly USER_AGENT = 'Sistema-Reportes-Urbis/1.0';

  /**
   * Geocodificación inversa: Convierte coordenadas GPS en dirección
   * Usa Nominatim de OpenStreetMap (gratuito, sin API key)
   */
  async reverseGeocode(coordinates: Coordinates): Promise<ReverseGeocodeResult | null> {
    try {
      const { latitude, longitude } = coordinates;

      // Validar coordenadas
      if (!this.isValidCoordinate(latitude, longitude)) {
        throw new Error('Coordenadas inválidas');
      }

      // Construir URL con parámetros
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        format: 'json',
        addressdetails: '1',
        zoom: '18', // Nivel de detalle (18 = edificio/casa)
        'accept-language': 'es' // Respuesta en español
      });

      const url = `${this.NOMINATIM_URL}?${params.toString()}`;

      // Hacer petición a Nominatim
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT
        }
      });

      if (!response.ok) {
        throw new Error(`Error en Nominatim: ${response.status}`);
      }

      const data = await response.json() as NominatimResponse;

      // Si no encuentra resultados
      if (!data || data.error) {
        console.log('No se encontró dirección para estas coordenadas');
        return null;
      }

      // Extraer componentes de la dirección
      const address: AddressComponents = data.address || {};

      // Construir dirección formateada
      const formattedAddress = this.formatAddress(address, data.display_name || '');

      // Construir calle (road + house_number)
      const street = this.buildStreet(address);

      return {
        formattedAddress,
        street,
        neighborhood: address.neighbourhood || address.suburb,
        parish: address.quarter || address.city_district, // Parroquia (quarter o city_district)
        municipality: address.municipality || address.county, // Municipio
        county: address.county,
        stateDistrict: address.state_district,
        borough: address.borough,
        cityDistrict: address.city_district,
        quarter: address.quarter,
        village: address.village,
        town: address.town,
        city: address.city,
        region: address.region,
        state: address.state,
        country: address.country,
        postalCode: address.postcode,
        countryCode: address.country_code,
        raw: data // Datos completos por si se necesitan
      };
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
      throw error;
    }
  }

  /**
   * Construir la calle con número de casa
   */
  private buildStreet(address: AddressComponents): string | undefined {
    const parts: string[] = [];

    if (address.road) {
      parts.push(address.road);
    }

    if (address.house_number) {
      parts.push(`#${address.house_number}`);
    }

    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  /**
   * Formatear dirección de forma legible
   */
  private formatAddress(address: AddressComponents, displayName: string): string {
    // Si tenemos componentes, construir dirección personalizada
    const parts: string[] = [];

    // Calle y número
    if (address.road) {
      if (address.house_number) {
        parts.push(`${address.road} #${address.house_number}`);
      } else {
        parts.push(address.road);
      }
    }

    // Barrio/Sector
    if (address.neighbourhood || address.suburb) {
      parts.push(address.neighbourhood || address.suburb || '');
    }

    // Ciudad
    if (address.city || address.municipality) {
      parts.push(address.city || address.municipality || '');
    }

    // Estado
    if (address.state) {
      parts.push(address.state);
    }

    // Si construimos algo, usarlo; si no, usar display_name
    return parts.length > 0 ? parts.join(', ') : displayName;
  }

  /**
   * Validar coordenadas
   */
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Obtener dirección simplificada (solo lo esencial)
   */
  async getSimpleAddress(coordinates: Coordinates): Promise<string | null> {
    try {
      const result = await this.reverseGeocode(coordinates);
      return result?.formattedAddress || null;
    } catch (error) {
      console.error('Error obteniendo dirección simple:', error);
      return null;
    }
  }
}

export default new GeocodingService();
