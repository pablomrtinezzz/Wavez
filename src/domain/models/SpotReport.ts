export interface ExifData {
  dateTimeOriginal?: string;
  latitude?: number;
  longitude?: number;
  deviceMake?: string;
  deviceModel?: string;
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
  exifData?: ExifData;
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
