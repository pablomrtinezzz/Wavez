export interface ExifData {
  dateTimeOriginal?: string;
  latitude?: number;
  longitude?: number;
  deviceMake?: string;
  deviceModel?: string;
}

/** Position reported by the device's geolocation API at capture time. */
export interface DeviceLocation {
  lat: number;
  lng: number;
  /** Radius of uncertainty in metres, as reported by the browser. */
  accuracyM: number;
}

export interface SpotReport {
  id: string;
  spotId: string;
  photoUrl: string;
  thumbnailUrl?: string;
  capturedAt: string; // ISO-8601
  uploadedAt: string; // ISO-8601
  userNote?: string;
  isRealtimeVerified: boolean;
  captureMethod: 'camera_direct' | 'gallery_upload';
  /** Only the distance is stored; the uploader's exact position never is. */
  distanceToSpotMeters?: number;
  verificationFlags: string[];
  // Weather condition snapshot when the photo was reported
  conditionSnapshot?: {
    waveHeightM: number;
    periodSec: number;
    windSpeedKmh: number;
    windCompass: string;
  };
}
