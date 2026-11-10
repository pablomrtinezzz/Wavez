import { ExifData } from '../models/SpotReport';

export interface ValidationResult {
  isValid: boolean;
  isRealtimeVerified: boolean;
  distanceToSpotMeters?: number;
  flags: string[];
  rejectionReason?: string;
}

export class ExifSecurityValidator {
  /**
   * Calculates distance in meters between two coordinates via Haversine formula
   */
  public static calculateHaversineDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Radius of Earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Evaluates if a photo meets anti-cheat and temporal constraints
   */
  public static validate(params: {
    captureMethod: 'camera_direct' | 'gallery_upload';
    exifData?: ExifData;
    spotCoordinates: { lat: number; lng: number };
    maxAgeHours?: number; // default: 3 hours
    maxDistanceMeters?: number; // default: 2500 meters (2.5km)
    currentTimeIso?: string;
  }): ValidationResult {
    const {
      captureMethod,
      exifData,
      spotCoordinates,
      maxAgeHours = 3,
      maxDistanceMeters = 2500,
      currentTimeIso = new Date().toISOString(),
    } = params;

    const flags: string[] = [];
    const now = new Date(currentTimeIso).getTime();

    // 1. Direct camera capture check
    if (captureMethod === 'camera_direct') {
      flags.push('CAPTURA_EN_VIVO: Disparo directo desde cámara verificado.');
    } else {
      flags.push('SUBIDA_GALERIA: Imagen seleccionada desde la fototeca.');
    }

    // 2. EXIF timestamp check
    let photoTimeMs = now;
    if (exifData?.dateTimeOriginal) {
      const parsedTime = Date.parse(exifData.dateTimeOriginal);
      if (!isNaN(parsedTime)) {
        photoTimeMs = parsedTime;
        const ageHours = (now - photoTimeMs) / (1000 * 60 * 60);

        // Security check: Future timestamp (allow 5 min clock skew)
        if (photoTimeMs > now + 5 * 60 * 1000) {
          return {
            isValid: false,
            isRealtimeVerified: false,
            flags: [...flags, 'HORA_FUTURA: La fecha de la foto está en el futuro.'],
            rejectionReason: 'La fecha de la foto no es válida (está en el futuro).',
          };
        }

        // Freshness check: Reject if older than maxAgeHours
        if (ageHours > maxAgeHours) {
          return {
            isValid: false,
            isRealtimeVerified: false,
            flags: [...flags, `FOTO_EXPIRADA: La foto se tomó hace ${ageHours.toFixed(1)}h (máx permitido: ${maxAgeHours}h)`],
            rejectionReason: `La foto es antigua (tomada hace más de ${maxAgeHours} horas). Debe ser reciente para reflejar las condiciones actuales.`,
          };
        }

        flags.push(`HORA_VALIDA: Foto tomada hace ${Math.round(ageHours * 60)} min.`);
      } else {
        flags.push('SIN_METADATOS_FECHA: No se pudo verificar la fecha original.');
      }
    } else if (captureMethod === 'gallery_upload') {
      flags.push('SIN_EXIF_FECHA: Las fotos de galería sin metadatos no reciben el sello de verificación.');
    }

    // 3. Geofencing check (if GPS available)
    let distanceMeters: number | undefined;
    if (
      exifData?.latitude !== undefined &&
      exifData?.longitude !== undefined
    ) {
      distanceMeters = this.calculateHaversineDistanceMeters(
        exifData.latitude,
        exifData.longitude,
        spotCoordinates.lat,
        spotCoordinates.lng
      );

      if (distanceMeters > maxDistanceMeters) {
        flags.push(`FUERA_DE_RANGO: Disparada a ${(distanceMeters / 1000).toFixed(1)}km del spot (máx ${maxDistanceMeters / 1000}km).`);
      } else {
        flags.push(`GPS_VERIFICADO: Foto tomada a ${distanceMeters}m de la playa.`);
      }
    }

    // 4. Overall verification verdict
    // Verified if:
    // A) Directly shot from camera NOW, OR
    // B) Has valid EXIF <= maxAgeHours AND within maxDistanceMeters (or camera direct without GPS)
    const isRealtimeVerified =
      captureMethod === 'camera_direct' ||
      (distanceMeters !== undefined && distanceMeters <= maxDistanceMeters && photoTimeMs <= now);

    return {
      isValid: true,
      isRealtimeVerified,
      distanceToSpotMeters: distanceMeters,
      flags,
    };
  }
}
