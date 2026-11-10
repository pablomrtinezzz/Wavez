import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { SurfForecastScraperAdapter } from './SurfForecastScraperAdapter';

describe('SurfForecastScraperAdapter', () => {
  const adapter = new SurfForecastScraperAdapter();

  test('successfully retrieves or falls back with positive energy in kJ', async () => {
    // Test Playa del Hombre slug
    const result = await adapter.getSpotEnergy('Playa-del-Hombre', 1.4, 11);

    assert.equal(result.spotSlug, 'Playa-del-Hombre');
    assert.ok(result.energyKj > 0, `Expected energyKj > 0, got ${result.energyKj}`);
    assert.ok(['scraped', 'calculated_fallback'].includes(result.source));
  });

  test('fallback calculation produces realistic kJ for given wave height and period', async () => {
    // Non-existent slug should trigger fallback without throwing an exception
    const result = await adapter.getSpotEnergy('Non-Existent-Slug-XYZ', 2.0, 14);

    assert.equal(result.spotSlug, 'Non-Existent-Slug-XYZ');
    assert.equal(result.source, 'calculated_fallback');
    // 40 * 2^2 * 14 = 2240 kJ
    assert.ok(result.energyKj >= 2000 && result.energyKj <= 2500, `Expected ~2240, got ${result.energyKj}`);
  });
});
