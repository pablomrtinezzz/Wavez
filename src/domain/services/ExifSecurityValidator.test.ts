import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { ExifSecurityValidator } from './ExifSecurityValidator';

describe('ExifSecurityValidator', () => {
  const spotCoords = { lat: 28.006, lng: -15.378 }; // Playa del Hombre
  const referenceTime = '2026-11-10T12:00:00.000Z';

  test('validates direct camera capture as verified', () => {
    const result = ExifSecurityValidator.validate({
      captureMethod: 'camera_direct',
      spotCoordinates: spotCoords,
      currentTimeIso: referenceTime,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.isRealtimeVerified, true);
    assert.ok(result.flags.some((f) => f.includes('CAPTURA_EN_VIVO')));
  });

  test('rejects photo with future timestamp (tampering/clock cheat)', () => {
    const futureTime = '2026-11-10T14:30:00.000Z'; // 2.5 hours in the future
    const result = ExifSecurityValidator.validate({
      captureMethod: 'gallery_upload',
      exifData: {
        dateTimeOriginal: futureTime,
        latitude: spotCoords.lat,
        longitude: spotCoords.lng,
      },
      spotCoordinates: spotCoords,
      currentTimeIso: referenceTime,
    });

    assert.equal(result.isValid, false);
    assert.equal(result.isRealtimeVerified, false);
    assert.ok(result.flags.some((f) => f.includes('HORA_FUTURA')));
  });

  test('rejects photo taken yesterday (stale photo)', () => {
    const oldTime = '2026-11-09T10:00:00.000Z'; // >24h ago
    const result = ExifSecurityValidator.validate({
      captureMethod: 'gallery_upload',
      exifData: {
        dateTimeOriginal: oldTime,
        latitude: spotCoords.lat,
        longitude: spotCoords.lng,
      },
      spotCoordinates: spotCoords,
      maxAgeHours: 3,
      currentTimeIso: referenceTime,
    });

    assert.equal(result.isValid, false);
    assert.equal(result.isRealtimeVerified, false);
    assert.ok(result.flags.some((f) => f.includes('FOTO_EXPIRADA')));
  });

  test('verifies recent photo within 500m of the spot', () => {
    // Coordinate ~300 meters away from Playa del Hombre
    const nearbyCoords = { lat: 28.008, lng: -15.379 };
    const recentTime = '2026-11-10T11:45:00.000Z'; // 15 mins ago

    const result = ExifSecurityValidator.validate({
      captureMethod: 'gallery_upload',
      exifData: {
        dateTimeOriginal: recentTime,
        latitude: nearbyCoords.lat,
        longitude: nearbyCoords.lng,
      },
      spotCoordinates: spotCoords,
      maxDistanceMeters: 2500,
      currentTimeIso: referenceTime,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.isRealtimeVerified, true);
    assert.ok(result.distanceToSpotMeters !== undefined && result.distanceToSpotMeters < 1000);
    assert.ok(result.flags.some((f) => f.includes('GPS_VERIFICADO')));
  });

  test('flags photo taken far away (e.g. from Maspalomas for Playa del Hombre)', () => {
    const maspalomasCoords = { lat: 27.733, lng: -15.586 }; // ~35km away
    const recentTime = '2026-11-10T11:50:00.000Z';

    const result = ExifSecurityValidator.validate({
      captureMethod: 'gallery_upload',
      exifData: {
        dateTimeOriginal: recentTime,
        latitude: maspalomasCoords.lat,
        longitude: maspalomasCoords.lng,
      },
      spotCoordinates: spotCoords,
      maxDistanceMeters: 2500,
      currentTimeIso: referenceTime,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.isRealtimeVerified, false);
    assert.ok(result.flags.some((f) => f.includes('FUERA_DE_RANGO')));
  });

  test('does not verify a gallery photo with GPS but no capture date', () => {
    const result = ExifSecurityValidator.validate({
      captureMethod: 'gallery_upload',
      exifData: { latitude: spotCoords.lat, longitude: spotCoords.lng },
      spotCoordinates: spotCoords,
      currentTimeIso: referenceTime,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.isRealtimeVerified, false);
  });

  test('does not verify a camera capture whose GPS is outside the geofence', () => {
    const result = ExifSecurityValidator.validate({
      captureMethod: 'camera_direct',
      exifData: { latitude: 27.733, longitude: -15.586 },
      spotCoordinates: spotCoords,
      maxDistanceMeters: 2500,
      currentTimeIso: referenceTime,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.isRealtimeVerified, false);
    assert.ok(result.flags.some((f) => f.includes('FUERA_DE_RANGO')));
  });
});
