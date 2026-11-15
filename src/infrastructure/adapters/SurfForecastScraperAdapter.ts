import * as cheerio from 'cheerio';
import { SurfForecastEnergy, estimateWaveEnergyKj } from '@/domain/models/SurfForecastEnergy';
import { EnergyScraperService } from '@/domain/ports/EnergyScraperService';

interface CacheItem {
  energy: SurfForecastEnergy;
  expiresAt: number;
}

export class SurfForecastScraperAdapter implements EnergyScraperService {
  private cache = new Map<string, CacheItem>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache
  private readonly USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 WavezSurfMonitor/1.0';

  public async getSpotEnergy(
    spotSlug: string,
    fallbackWaveHeightM: number = 1.2,
    fallbackPeriodSec: number = 10
  ): Promise<SurfForecastEnergy> {
    const cached = this.cache.get(spotSlug);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.energy;
    }

    try {
      const url = `https://www.surf-forecast.com/breaks/${spotSlug}/forecasts/latest`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Surf-forecast returned HTTP status ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract Wave Energy row
      // Target: <tr class="forecast-table__row" data-row="wave-energy">
      const energyRow = $('tr[data-row="wave-energy"]');
      let currentEnergyKj = 0;

      if (energyRow.length > 0) {
        const firstCell = energyRow.find('td').first().text().trim();
        const parsed = parseInt(firstCell, 10);
        if (!isNaN(parsed) && parsed > 0) {
          currentEnergyKj = parsed;
        }
      }

      // Extract Rating row
      const ratingRow = $('tr[data-row="rating"]');
      let rating: number | undefined;
      if (ratingRow.length > 0) {
        const firstRating = ratingRow.find('td').first().text().trim();
        const parsedRating = parseInt(firstRating, 10);
        if (!isNaN(parsedRating)) {
          rating = parsedRating;
        }
      }

      if (currentEnergyKj > 0) {
        const result: SurfForecastEnergy = {
          spotSlug,
          timestamp: new Date().toISOString(),
          energyKj: currentEnergyKj,
          starRating: rating,
          source: 'scraped',
        };

        this.cache.set(spotSlug, {
          energy: result,
          expiresAt: Date.now() + this.CACHE_TTL_MS,
        });

        return result;
      }

      // If scraper didn't find energy cell, fallback to calculation
      throw new Error(`Could not parse energy cell for slug: ${spotSlug}`);
    } catch (error) {
      console.warn(`[SurfForecastScraper] Fallback calculation for ${spotSlug}:`, (error as Error).message);

      const estimatedKj = estimateWaveEnergyKj(fallbackWaveHeightM, fallbackPeriodSec);
      const fallbackResult: SurfForecastEnergy = {
        spotSlug,
        timestamp: new Date().toISOString(),
        energyKj: estimatedKj,
        starRating: estimatedKj > 1500 ? 4 : estimatedKj > 800 ? 3 : 2,
        source: 'calculated_fallback',
        waveHeightM: fallbackWaveHeightM,
        periodSec: fallbackPeriodSec,
      };

      // Cache fallback for 15 minutes to avoid retrying failed network requests immediately
      this.cache.set(spotSlug, {
        energy: fallbackResult,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      return fallbackResult;
    }
  }
}
